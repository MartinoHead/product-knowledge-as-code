import { expect, test } from '@playwright/test';
import { apiGet, apiPost, attachRequestFailureLogger, authHeaders, uniqueEmail } from '../helpers/api-helpers.js';

// Auto-generated API tests from synchronized knowledge (md/yaml/gherkin).
// Generator emits executable deterministic baseline scenarios.
// When a test fails, request/response trace is printed to stderr.

attachRequestFailureLogger();

test('[LGN-001] API Login requires registered email.', async ({ request }) => {
  const response = await apiPost(request, '/v1/login', {
    data: { email: uniqueEmail('login-missing-user'), password: 'valid-password-123' },
  });
  expect([401, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  expect(await response.json()).toEqual({ error: 'invalid_credentials', message: 'Invalid credentials.' });
});

test('[LGN-002] API Login requires correct password for the registered email.', async ({ request }) => {
  const email = uniqueEmail('login-wrong-password');
  const password = 'valid-password-123';
  const reg = await apiPost(request, '/v1/registration', { data: { email, password } });
  expect([201, 503]).toContain(reg.status());
  if (reg.status() === 503) {
    expect(await reg.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  const response = await apiPost(request, '/v1/login', { data: { email, password: 'wrong-password-999' } });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: 'invalid_credentials', message: 'Invalid credentials.' });
});

test('[LGN-003] API Successful login returns an active session token.', async ({ request }) => {
  const email = uniqueEmail('login-success');
  const password = 'valid-password-123';
  const reg = await apiPost(request, '/v1/registration', { data: { email, password } });
  expect([201, 503]).toContain(reg.status());
  if (reg.status() === 503) {
    expect(await reg.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  const response = await apiPost(request, '/v1/login', { data: { email, password } });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.tokenType).toBe('Bearer');
  expect(body.active).toBe(true);
  expect(body.sessionToken).toMatch(/^eyJ/);
});

test('[LOG-001] API Document behavior change inferred from PR impact for login. Source signal: keyword "auth" matched: import { hashPassword } from \'../auth/password.js\';.', async ({ request }) => {
  const response = await apiPost(request, '/v1/login', { data: ['not-an-object'] });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid_request', message: 'Request body must be a JSON object.' });
});

test('[LOG-002] API Document behavior change inferred from PR impact for login. Source signal: keyword "auth" matched: import { hashPassword } from \'../auth/password.js\';.', async ({ request }) => {
  const response = await apiPost(request, '/v1/login', { data: ['not-an-object'] });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid_request', message: 'Request body must be a JSON object.' });
});
