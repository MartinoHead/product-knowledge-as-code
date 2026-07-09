import { expect, test } from '@playwright/test';
import { uniqueEmail } from '../helpers/api-helpers.js';

async function register(request: { post: (...args: unknown[]) => Promise<{ status: () => number; json: () => Promise<unknown> }> }, email: string, password: string) {
  return request.post('/v1/registration', {
    data: { email, password },
  });
}

test('[LGN-001] API Login requires registered email.', async ({ request }) => {
  const response = await request.post('/v1/login', {
    data: {
      email: uniqueEmail('login-missing-user'),
      password: 'valid-password-123',
    },
  });

  expect([401, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  expect(await response.json()).toEqual({
    error: 'invalid_credentials',
    message: 'Invalid credentials.',
  });
});

test('[LGN-002] API Login requires correct password for the registered email.', async ({ request }) => {
  const email = uniqueEmail('login-wrong-password');
  const password = 'valid-password-123';

  const reg = await register(request, email, password);
  expect([201, 503]).toContain(reg.status());

  if (reg.status() === 503) {
    expect(await reg.json()).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  const login = await request.post('/v1/login', {
    data: {
      email,
      password: 'wrong-password-999',
    },
  });

  expect(login.status()).toBe(401);
  expect(await login.json()).toEqual({
    error: 'invalid_credentials',
    message: 'Invalid credentials.',
  });
});

test('[LGN-003] API Successful login returns an active session token.', async ({ request }) => {
  const email = uniqueEmail('login-success');
  const password = 'valid-password-123';

  const reg = await register(request, email, password);
  expect([201, 503]).toContain(reg.status());

  if (reg.status() === 503) {
    expect(await reg.json()).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  const login = await request.post('/v1/login', {
    data: {
      email,
      password,
    },
  });

  expect(login.status()).toBe(200);
  const body = await login.json();
  expect(body.tokenType).toBe('Bearer');
  expect(body.active).toBe(true);
  expect(body.sessionToken).toMatch(/^eyJ/);
});

test('[LOG-001] API Document behavior change inferred from PR impact for login. Source signal: keyword "auth" matched: import { hashPassword } from ../auth/password.js;.', async ({ request }) => {
  const response = await request.post('/v1/login', {
    data: ['not-an-object'],
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    error: 'invalid_request',
    message: 'Request body must be a JSON object.',
  });
});

test('[LOG-002] API Document behavior change inferred from PR impact for login. Source signal: keyword "auth" matched: import { hashPassword } from ../auth/password.js;.', async ({ request }) => {
  const response = await request.post('/v1/login', {
    data: {
      email: 'not-an-email',
      password: 'whatever',
    },
  });

  expect([401, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  expect(await response.json()).toEqual({
    error: 'invalid_credentials',
    message: 'Invalid credentials.',
  });
});
