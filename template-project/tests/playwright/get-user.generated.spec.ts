import { expect, test } from '@playwright/test';
import { authHeaders, uniqueEmail } from '../helpers/api-helpers.js';

// Demo-generated from Markdown knowledge source of truth.
// This file is a derived artifact.

test('[USG-001] Get user requires authorization.', async ({ request }) => {
  const response = await request.get('/v1/users/usr_1');
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({
    error: 'unauthorized',
    message: 'Authorization required.',
  });
});

test('[USG-002] Get user requires existing user identifier.', async ({ request }) => {
  const response = await request.get('/v1/users/usr_missing', {
    headers: authHeaders('usr_pwg_reader'),
  });

  expect([404, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  expect(await response.json()).toEqual({
    error: 'not_found',
    message: 'User not found.',
  });
});

test('[USG-003] Successful get user returns user details payload.', async ({ request }) => {
  const created = await request.post('/v1/users', {
    headers: authHeaders('usr_pwg_creator'),
    data: {
      email: uniqueEmail('pwg-get-user'),
      firstName: 'Generated',
      lastName: 'Lookup',
    },
  });

  expect([201, 503]).toContain(created.status());
  if (created.status() === 503) {
    expect(await created.json()).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  const { userId } = await created.json();
  const response = await request.get(`/v1/users/${userId}`, {
    headers: authHeaders('usr_pwg_reader'),
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.userId).toBe(userId);
  expect(typeof body.email).toBe('string');
  expect(typeof body.firstName).toBe('string');
  expect(typeof body.lastName).toBe('string');
});
