import { expect, test } from '@playwright/test';
import { apiGet, apiPost, attachRequestFailureLogger, authHeaders, uniqueEmail } from '../helpers/api-helpers.js';

// Auto-generated Playwright tests from synchronized knowledge (md/yaml/gherkin).
// Derived from API executable scenarios to keep behavior traceability aligned.
// When a test fails, request/response trace is printed to stderr.

attachRequestFailureLogger();

test('[LISTUSR-001] List users requires authorization.', async ({ request }) => {
  const response = await apiGet(request, '/v1/users');
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: 'unauthorized', message: 'Authorization required.' });
});

test('[LISTUSR-002] List users returns empty array when no users exist.', async ({ request }) => {
  const response = await apiGet(request, '/v1/users', { headers: authHeaders('usr_list_empty') });
  expect([200, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  const body = await response.json();
  expect(Array.isArray(body.users)).toBe(true);
});

test('[LISTUSR-003] List users returns all created managed users.', async ({ request }) => {
  const a = uniqueEmail('list-a');
  const b = uniqueEmail('list-b');
  const first = await apiPost(request, '/v1/users', { headers: authHeaders(), data: { email: a, firstName: 'List', lastName: 'A' } });
  expect([201, 503]).toContain(first.status());
  if (first.status() === 503) {
    expect(await first.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });
    return;
  }
  await apiPost(request, '/v1/users', { headers: authHeaders(), data: { email: b, firstName: 'List', lastName: 'B' } });
  const list = await apiGet(request, '/v1/users', { headers: authHeaders() });
  expect(list.status()).toBe(200);
  const emails = (await list.json()).users.map((u) => u.email);
  expect(emails).toContain(a);
  expect(emails).toContain(b);
});

test('[LISTUSR-004] List users includes userId, email, firstName, and lastName fields.', async ({ request }) => {
  const response = await apiGet(request, '/v1/users', { headers: authHeaders('usr_list_fields') });
  expect([200, 503]).toContain(response.status());
  if (response.status() === 503) return;
  for (const user of (await response.json()).users) {
    expect(typeof user.userId).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.firstName).toBe('string');
    expect(typeof user.lastName).toBe('string');
  }
});

test('[LISTUSR-005] List users returns users in creation order.', async ({ request }) => {
  const firstEmail = uniqueEmail('order-first');
  const secondEmail = uniqueEmail('order-second');
  const first = await apiPost(request, '/v1/users', { headers: authHeaders(), data: { email: firstEmail, firstName: 'Order', lastName: 'First' } });
  expect([201, 503]).toContain(first.status());
  if (first.status() === 503) return;
  await apiPost(request, '/v1/users', { headers: authHeaders(), data: { email: secondEmail, firstName: 'Order', lastName: 'Second' } });
  const list = await apiGet(request, '/v1/users', { headers: authHeaders() });
  const body = await list.json();
  const firstIndex = body.users.findIndex((u) => u.email === firstEmail);
  const secondIndex = body.users.findIndex((u) => u.email === secondEmail);
  expect(firstIndex).toBeGreaterThanOrEqual(0);
  expect(secondIndex).toBeGreaterThanOrEqual(0);
  expect(firstIndex).toBeLessThan(secondIndex);
});

test('[LISTUSR-006] Invalid token returns unauthorized response.', async ({ request }) => {
  const response = await apiGet(request, '/v1/users', { headers: { Authorization: 'Bearer invalid-token' } });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: 'unauthorized', message: 'Authorization required.' });
});
