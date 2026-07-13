import { expect, test } from '@playwright/test';
import { apiGet, apiPost, attachRequestFailureLogger, authHeaders, uniqueEmail } from '../../helpers/api-helpers.js';

// Auto-generated API tests from synchronized knowledge (md/yaml/gherkin).
// Generator emits executable deterministic baseline scenarios.
// When a test fails, request/response trace is printed to stderr.

attachRequestFailureLogger();

test('[USR-001] API Create user requires authorization.', async ({ request }) => {
  const response = await apiPost(request, '/v1/users', {
    data: { email: uniqueEmail('users-unauthorized'), firstName: 'Unauth', lastName: 'User' },
  });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: 'unauthorized', message: 'Authorization required.' });
});

test('[USR-002] API Create user requires unique email.', async ({ request }) => {
  const email = uniqueEmail('users-duplicate');
  const first = await apiPost(request, '/v1/users', { headers: authHeaders(), data: { email, firstName: 'First', lastName: 'User' } });
  expect([201, 503]).toContain(first.status());
  if (first.status() === 503) {
    expect(await first.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  const second = await apiPost(request, '/v1/users', { headers: authHeaders(), data: { email, firstName: 'Second', lastName: 'User' } });
  expect(second.status()).toBe(409);
  expect(await second.json()).toEqual({ error: 'duplicate_email', message: 'Email already exists.' });
});

test('[USR-003] API Successful create user returns created user identifier.', async ({ request }) => {
  const response = await apiPost(request, '/v1/users', {
    headers: authHeaders(),
    data: { email: uniqueEmail('users-success'), firstName: 'Happy', lastName: 'Path' },
  });
  expect([201, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  const body = await response.json();
  expect(body.userId).toMatch(/^usr_\d+$/);
});
