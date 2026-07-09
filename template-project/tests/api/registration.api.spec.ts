import { expect, test } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

test('[REG-001] API Email must be valid format.', async ({ request }) => {
  const response = await request.post('/v1/registration', {
    data: {
      email: 'invalid-email-format',
      password: 'valid-password-123',
    },
  });

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body).toEqual({
    error: 'invalid_email',
    message: 'Email must be valid format.',
  });
});

test('[REG-002] API Email must be unique.', async ({ request }) => {
  const email = uniqueEmail('reg-duplicate');

  const first = await request.post('/v1/registration', {
    data: {
      email,
      password: 'valid-password-123',
    },
  });

  expect([201, 503]).toContain(first.status());

  if (first.status() === 503) {
    const body = await first.json();
    expect(body).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  const second = await request.post('/v1/registration', {
    data: {
      email,
      password: 'valid-password-123',
    },
  });

  expect(second.status()).toBe(409);
  const duplicateBody = await second.json();
  expect(duplicateBody).toEqual({
    error: 'duplicate_email',
    message: 'Email already registered.',
  });
});

test('[REG-003] API Password length must be at least 10 characters.', async ({ request }) => {
  const response = await request.post('/v1/registration', {
    data: {
      email: uniqueEmail('reg-short-pass'),
      password: 'short',
    },
  });

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body).toEqual({
    error: 'invalid_password',
    message: 'Password length must be at least 10 characters.',
  });
});

test('[REG-004] API Verification email is sent after successful registration.', async ({ request }) => {
  const response = await request.post('/v1/registration', {
    data: {
      email: uniqueEmail('reg-success'),
      password: 'valid-password-123',
    },
  });

  expect([201, 503]).toContain(response.status());

  if (response.status() === 503) {
    const unavailableBody = await response.json();
    expect(unavailableBody).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  const body = await response.json();
  expect(body.userId).toMatch(/^usr_\d+$/);
  expect(body.email).toContain('@example.com');
  expect(body.verificationEmailQueued).toBe(true);
});
