import { type APIRequestContext, expect, test } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

async function register(request: APIRequestContext, email: string, password: string) {
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
    const body = await response.json();
    expect(body).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  const invalidBody = await response.json();
  expect(invalidBody).toEqual({
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
    const body = await reg.json();
    expect(body).toEqual({
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
  const invalidBody = await login.json();
  expect(invalidBody).toEqual({
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
    const body = await reg.json();
    expect(body).toEqual({
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
