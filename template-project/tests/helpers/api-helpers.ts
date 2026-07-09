import { createJwtForUser } from '../../src/auth/jwt.js';
import { test, type APIRequestContext, type APIResponse, type TestInfo } from '@playwright/test';

type RequestOptions = Parameters<APIRequestContext['post']>[1];

const LIVE_AUTH_MARKER = 'x-pkac-auth-source';
const LIVE_AUTH_MARKER_VALUE = 'local-helper';

let cachedLiveBearerToken: string | null = null;

type TraceEntry = {
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
};

const tracesByTest = new Map<string, TraceEntry[]>();

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

export function authHeaders(userId = 'usr_test_actor'): Record<string, string> {
  return {
    Authorization: `Bearer ${createJwtForUser(userId)}`,
    [LIVE_AUTH_MARKER]: LIVE_AUTH_MARKER_VALUE,
  };
}

function isLiveApiRun(): boolean {
  return Boolean(process.env.BASE_API_URL || process.env.BASE_URL);
}

function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
  if (!headers) {
    return headers;
  }
  const sanitized = { ...headers };
  if (sanitized.Authorization) {
    sanitized.Authorization = 'Bearer <redacted>';
  }
  return sanitized;
}

async function ensureLiveBearerToken(request: APIRequestContext): Promise<string> {
  if (cachedLiveBearerToken) {
    return cachedLiveBearerToken;
  }

  const email = uniqueEmail('live-auth');
  const password = 'valid-password-123';

  const registration = await request.post('/v1/registration', {
    data: { email, password },
  });
  if (![201, 409].includes(registration.status())) {
    const body = await registration.text();
    throw new Error(`Live auth bootstrap registration failed (${registration.status()}): ${body}`);
  }

  const login = await request.post('/v1/login', {
    data: { email, password },
  });
  if (login.status() !== 200) {
    const body = await login.text();
    throw new Error(`Live auth bootstrap login failed (${login.status()}): ${body}`);
  }

  const loginBody = await login.json();
  if (!loginBody || typeof loginBody.sessionToken !== 'string' || !loginBody.sessionToken.length) {
    throw new Error('Live auth bootstrap login response missing sessionToken.');
  }

  cachedLiveBearerToken = loginBody.sessionToken;
  return cachedLiveBearerToken;
}

async function withLiveAuthIfNeeded(request: APIRequestContext, options?: RequestOptions): Promise<RequestOptions> {
  const next: RequestOptions = options ? { ...options } : {};
  const headers = { ...((next.headers as Record<string, string> | undefined) || {}) };

  if (!isLiveApiRun()) {
    next.headers = headers;
    return next;
  }

  const marker = headers[LIVE_AUTH_MARKER];
  if (marker !== LIVE_AUTH_MARKER_VALUE) {
    next.headers = headers;
    return next;
  }

  if (headers.Authorization === 'Bearer invalid-token') {
    delete headers[LIVE_AUTH_MARKER];
    next.headers = headers;
    return next;
  }

  const liveToken = await ensureLiveBearerToken(request);
  headers.Authorization = `Bearer ${liveToken}`;
  delete headers[LIVE_AUTH_MARKER];
  next.headers = headers;
  return next;
}

function getTraceKey(testInfo: TestInfo): string {
  return testInfo.titlePath.join(' > ');
}

function stringifyBody(data: unknown): string {
  if (data === undefined) {
    return '';
  }
  if (typeof data === 'string') {
    return data;
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

function truncate(value: string, limit = 3000): string {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit)}... <truncated ${value.length - limit} chars>`;
}

async function readResponseBody(response: APIResponse): Promise<string> {
  try {
    return truncate(await response.text());
  } catch (error) {
    return `<unable to read response body: ${String(error)}>`;
  }
}

async function captureTrace(
  method: string,
  url: string,
  options: RequestOptions,
  response: APIResponse
): Promise<void> {
  const key = getTraceKey(test.info());
  const entry: TraceEntry = {
    method,
    url,
    requestHeaders: sanitizeHeaders((options?.headers as Record<string, string> | undefined) || undefined),
    requestBody: truncate(stringifyBody(options?.data)),
    status: response.status(),
    statusText: response.statusText(),
    responseHeaders: response.headers(),
    responseBody: await readResponseBody(response),
  };

  const existing = tracesByTest.get(key) || [];
  existing.push(entry);
  tracesByTest.set(key, existing);
}

export async function apiPost(request: APIRequestContext, url: string, options?: RequestOptions): Promise<APIResponse> {
  try {
    const resolvedOptions = await withLiveAuthIfNeeded(request, options);
    const response = await request.post(url, resolvedOptions);
    await captureTrace('POST', url, resolvedOptions, response);
    return response;
  } catch (error) {
    console.error('[api-trace] Request failed before response', {
      method: 'POST',
      url,
      headers: sanitizeHeaders(options?.headers as Record<string, string> | undefined),
      body: stringifyBody(options?.data),
      error: String(error),
    });
    throw error;
  }
}

export async function apiGet(request: APIRequestContext, url: string, options?: RequestOptions): Promise<APIResponse> {
  try {
    const resolvedOptions = await withLiveAuthIfNeeded(request, options);
    const response = await request.get(url, resolvedOptions);
    await captureTrace('GET', url, resolvedOptions, response);
    return response;
  } catch (error) {
    console.error('[api-trace] Request failed before response', {
      method: 'GET',
      url,
      headers: sanitizeHeaders(options?.headers as Record<string, string> | undefined),
      error: String(error),
    });
    throw error;
  }
}

export function attachRequestFailureLogger(): void {
  test.afterEach(async ({}, testInfo) => {
    const key = getTraceKey(testInfo);
    const traces = tracesByTest.get(key) || [];

    if (testInfo.status !== testInfo.expectedStatus) {
      console.error(`\n[api-trace] ${testInfo.title} failed. Captured request/response trace:`);
      traces.forEach((trace, index) => {
        console.error(`[api-trace] #${index + 1} ${trace.method} ${trace.url}`);
        if (trace.requestHeaders) {
          console.error(`[api-trace] request headers: ${JSON.stringify(trace.requestHeaders)}`);
        }
        if (trace.requestBody) {
          console.error(`[api-trace] request body: ${trace.requestBody}`);
        }
        console.error(`[api-trace] response: ${trace.status} ${trace.statusText}`);
        console.error(`[api-trace] response headers: ${JSON.stringify(trace.responseHeaders)}`);
        console.error(`[api-trace] response body: ${trace.responseBody}`);
      });
      console.error('[api-trace] end trace\n');
    }

    tracesByTest.delete(key);
  });
}
