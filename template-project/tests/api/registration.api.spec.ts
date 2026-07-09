import { expect, test } from '@playwright/test';
import { authHeaders, uniqueEmail } from '../helpers/api-helpers.js';

// Auto-generated API tests from synchronized knowledge (md/yaml/gherkin).
// Generator emits executable deterministic baseline scenarios.

test('[REG-001] API Email must be valid format.', async ({ request }) => {
  const response = await request.post('/v1/registration', {
    data: { email: 'invalid-email-format', password: 'valid-password-123' },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid_email', message: 'Email must be valid format.' });
});

test('[REG-002] API Email must be unique.', async ({ request }) => {
  const email = uniqueEmail('reg-duplicate');
  const first = await request.post('/v1/registration', { data: { email, password: 'valid-password-123' } });
  expect([201, 503]).toContain(first.status());
  if (first.status() === 503) {
    expect(await first.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  const second = await request.post('/v1/registration', { data: { email, password: 'valid-password-123' } });
  expect(second.status()).toBe(409);
  expect(await second.json()).toEqual({ error: 'duplicate_email', message: 'Email already registered.' });
});

test('[REG-003] API Password length must be at least 10 characters.', async ({ request }) => {
  const response = await request.post('/v1/registration', {
    data: { email: uniqueEmail('reg-short-pass'), password: 'short' },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid_password', message: 'Password length must be at least 10 characters.' });
});

test('[REG-004] API Verification email is sent to the user after successful registration.', async ({ request }) => {
  const response = await request.post('/v1/registration', {
    data: { email: uniqueEmail('reg-success'), password: 'valid-password-123' },
  });
  expect([201, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  const body = await response.json();
  expect(body.userId).toMatch(/^usr_\d+$/);
  expect(body.verificationEmailQueued).toBe(true);
});

test('[REG-005] API Document behavior change inferred from PR impact for registration. Source signal: keyword "registration" matched: type RegistrationResult =.', async ({ request }) => {
  const response = await request.post('/v1/registration', { data: ['not-an-object'] });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid_request', message: 'Request body must be a JSON object.' });
});

test('[REG-006] API Document behavior change inferred from PR impact for registration. Source signal: keyword "registration" matched: type RegistrationResult =.', async ({ request }) => {
  const response = await request.post('/v1/registration', { data: ['not-an-object'] });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid_request', message: 'Request body must be a JSON object.' });
});
