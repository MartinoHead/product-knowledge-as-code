import { type APIRequestContext, expect, test } from '@playwright/test';
import { uniqueEmail } from '../helpers/api-helpers.js';

// Demo-generated from Markdown knowledge source of truth.
// This file is a derived artifact.

async function register(request: APIRequestContext, email: string, password: string) {
  return request.post('/v1/registration', {
    data: { email, password },
  });
}

test('[LGN-001] Login requires registered email.', async ({ request }) => {
  const response = await request.post('/v1/login', {
    data: {
      email: uniqueEmail('pwg-login-missing-user'),
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

test('[LGN-002] Login requires correct password for the registered email.', async ({ request }) => {
  const email = uniqueEmail('pwg-login-wrong-password');
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

test('[LGN-003] Successful login returns an active session token.', async ({ request }) => {
  const email = uniqueEmail('pwg-login-success');
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
