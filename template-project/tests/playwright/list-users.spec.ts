import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test('[LISTUSR-UI-001] List users page loads with authentication required message when not logged in.', async ({
  page,
}) => {
  // Visit a hypothetical users list page (would need to be implemented in UI)
  // For now, test that unauthenticated requests fail appropriately
  const response = await page.request.get(`${BASE_URL}/v1/users`);
  expect(response.status()).toBe(401);
});

test('[LISTUSR-UI-002] Authenticated user can access list users endpoint.', async ({ page }) => {
  // Register a user
  const email = `ui-test-list-${Date.now()}@example.com`;
  const password = 'TestPassword123456';

  // Register
  let response = await page.request.post(`${BASE_URL}/v1/registration`, {
    data: { email, password },
  });
  expect(response.status()).toBe(201);

  // Login
  response = await page.request.post(`${BASE_URL}/v1/login`, {
    data: { email, password },
  });
  expect(response.status()).toBe(200);
  const loginData = await response.json();
  const token = loginData.token;

  // Access list users endpoint with valid token
  response = await page.request.get(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty('users');
  expect(Array.isArray(data.users)).toBe(true);
});

test('[LISTUSR-UI-003] Managed users appear in the list after creation.', async ({ page }) => {
  const timestamp = Date.now();
  const email = `ui-test-create-list-${timestamp}@example.com`;
  const password = 'TestPassword123456';

  // Register and login
  let response = await page.request.post(`${BASE_URL}/v1/registration`, {
    data: { email, password },
  });
  expect(response.status()).toBe(201);

  response = await page.request.post(`${BASE_URL}/v1/login`, {
    data: { email, password },
  });
  expect(response.status()).toBe(200);
  const loginData = await response.json();
  const token = loginData.token;

  // Create managed users
  const managedUser1 = {
    email: `managed-ui-1-${timestamp}@example.com`,
    firstName: 'UI',
    lastName: 'TestUser1',
  };

  const managedUser2 = {
    email: `managed-ui-2-${timestamp}@example.com`,
    firstName: 'UI',
    lastName: 'TestUser2',
  };

  let createResponse = await page.request.post(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
    data: managedUser1,
  });
  expect(createResponse.status()).toBe(201);

  createResponse = await page.request.post(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
    data: managedUser2,
  });
  expect(createResponse.status()).toBe(201);

  // Get list of users
  response = await page.request.get(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);
  const listData = await response.json();

  // Verify both users are in the list
  const users = listData.users;
  const foundUser1 = users.find(u => u.email === managedUser1.email);
  const foundUser2 = users.find(u => u.email === managedUser2.email);

  expect(foundUser1).toBeDefined();
  expect(foundUser1.firstName).toBe('UI');
  expect(foundUser1.lastName).toBe('TestUser1');

  expect(foundUser2).toBeDefined();
  expect(foundUser2.firstName).toBe('UI');
  expect(foundUser2.lastName).toBe('TestUser2');
});

test('[LISTUSR-UI-004] List includes all user properties in correct format.', async ({ page }) => {
  const timestamp = Date.now();
  const email = `ui-test-props-${timestamp}@example.com`;
  const password = 'TestPassword123456';

  // Register and login
  let response = await page.request.post(`${BASE_URL}/v1/registration`, {
    data: { email, password },
  });
  const loginResponse = await page.request.post(`${BASE_URL}/v1/login`, {
    data: { email, password },
  });
  const loginData = await loginResponse.json();
  const token = loginData.token;

  // Create a managed user
  await page.request.post(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      email: `managed-props-${timestamp}@example.com`,
      firstName: 'PropTest',
      lastName: 'User',
    },
  });

  // Get list and verify properties
  response = await page.request.get(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await response.json();

  // Verify response structure
  expect(listData).toHaveProperty('users');
  expect(Array.isArray(listData.users)).toBe(true);

  if (listData.users.length > 0) {
    const user = listData.users[0];
    expect(user).toHaveProperty('userId');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('firstName');
    expect(user).toHaveProperty('lastName');

    // Verify no extra fields that shouldn't be exposed
    const allowedFields = ['userId', 'email', 'firstName', 'lastName'];
    const actualFields = Object.keys(user);
    expect(actualFields.sort()).toEqual(allowedFields.sort());
  }
});

test('[LISTUSR-UI-005] Different authenticated users see the same list.', async ({ page }) => {
  const timestamp = Date.now();

  // Create and authenticate first user
  const email1 = `ui-test-multi-user-1-${timestamp}@example.com`;
  await page.request.post(`${BASE_URL}/v1/registration`, {
    data: { email: email1, password: 'TestPassword123456' },
  });
  let response = await page.request.post(`${BASE_URL}/v1/login`, {
    data: { email: email1, password: 'TestPassword123456' },
  });
  const token1 = (await response.json()).token;

  // Create and authenticate second user
  const email2 = `ui-test-multi-user-2-${timestamp}@example.com`;
  await page.request.post(`${BASE_URL}/v1/registration`, {
    data: { email: email2, password: 'TestPassword123456' },
  });
  response = await page.request.post(`${BASE_URL}/v1/login`, {
    data: { email: email2, password: 'TestPassword123456' },
  });
  const token2 = (await response.json()).token;

  // Create managed users as first user
  const managedEmail = `shared-managed-${timestamp}@example.com`;
  await page.request.post(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token1}` },
    data: {
      email: managedEmail,
      firstName: 'Shared',
      lastName: 'User',
    },
  });

  // Get list from both users
  response = await page.request.get(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const list1 = await response.json();

  response = await page.request.get(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  const list2 = await response.json();

  // Verify both lists contain the shared managed user
  const user1Found = list1.users.find(u => u.email === managedEmail);
  const user2Found = list2.users.find(u => u.email === managedEmail);

  expect(user1Found).toBeDefined();
  expect(user2Found).toBeDefined();
  expect(user1Found.userId).toBe(user2Found.userId);
});

test('[LISTUSR-UI-006] List users endpoint returns 200 status code.', async ({ page }) => {
  const email = `ui-test-status-${Date.now()}@example.com`;

  // Register and login
  await page.request.post(`${BASE_URL}/v1/registration`, {
    data: { email, password: 'TestPassword123456' },
  });
  let response = await page.request.post(`${BASE_URL}/v1/login`, {
    data: { email, password: 'TestPassword123456' },
  });
  const token = (await response.json()).token;

  // Call list users endpoint and verify status code
  response = await page.request.get(`${BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);
  expect(response.ok()).toBe(true);

  // Verify response content-type
  const contentType = response.headers()['content-type'];
  expect(contentType).toContain('application/json');
});
