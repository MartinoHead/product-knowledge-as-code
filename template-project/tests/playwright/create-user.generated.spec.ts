import { expect, test } from '@playwright/test';
import { authHeaders, uniqueEmail } from '../helpers/api-helpers.js';

// Demo-generated from Markdown knowledge source of truth.
// This file is a derived artifact.

test('[USR-001] Create user requires authorization.', async ({ request }) => {
  const response = await request.post('/v1/users', {
    data: {
      email: uniqueEmail('pwg-users-unauth'),
      firstName: 'Generated',
      lastName: 'Scenario',
    },
  });

  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({
    error: 'unauthorized',
    message: 'Authorization required.',
  });
});

test('[USR-002] Create user requires unique email.', async ({ request }) => {
  const email = uniqueEmail('pwg-users-dupe');

  const first = await request.post('/v1/users', {
    headers: authHeaders('usr_pwg_actor'),
    data: {
      email,
      firstName: 'Generated',
      lastName: 'First',
    },
  });

  expect([201, 503]).toContain(first.status());
  if (first.status() === 503) {
    expect(await first.json()).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  const duplicate = await request.post('/v1/users', {
    headers: authHeaders('usr_pwg_actor'),
    data: {
      email,
      firstName: 'Generated',
      lastName: 'Second',
    },
  });

  expect(duplicate.status()).toBe(409);
  expect(await duplicate.json()).toEqual({
    error: 'duplicate_email',
    message: 'Email already exists.',
  });
});

test('[USR-003] Successful create user returns created user identifier.', async ({ request }) => {
  const response = await request.post('/v1/users', {
    headers: authHeaders('usr_pwg_actor'),
    data: {
      email: uniqueEmail('pwg-users-success'),
      firstName: 'Generated',
      lastName: 'Success',
    },
  });

  expect([201, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toEqual({
      error: 'service_unavailable',
      message: 'Persistent identity storage is unavailable. Try again later.',
    });
    return;
  }

  const body = await response.json();
  expect(body.userId).toMatch(/^usr_\d+$/);
});
