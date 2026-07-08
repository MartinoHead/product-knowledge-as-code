import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8080/v1';

// Helper to create a registration
async function registerUser(request, email: string, password: string) {
  const response = await request.post(`${API_URL}/registration`, {
    data: {
      email,
      password,
    },
  });
  return response;
}

// Helper to login and get token
async function loginUser(request, email: string, password: string) {
  const response = await request.post(`${API_URL}/login`, {
    data: {
      email,
      password,
    },
  });
  const data = await response.json();
  return data.token;
}

// Helper to create a managed user
async function createManagedUser(
  request,
  token: string,
  email: string,
  firstName: string,
  lastName: string,
) {
  const response = await request.post(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      email,
      firstName,
      lastName,
    },
  });
  return response;
}

test('[LISTUSR-001] API List users requires authorization.', async ({ request }) => {
  const response = await request.get(`${API_URL}/users`);
  expect(response.status()).toBe(401);

  const data = await response.json();
  expect(data.error).toBe('missing_auth');
});

test('[LISTUSR-002] API List users returns empty array when no users exist.', async ({
  request,
}) => {
  // Register and login
  const uniqueEmail = `test-list-empty-${Date.now()}@example.com`;
  await registerUser(request, uniqueEmail, 'password123456');
  const token = await loginUser(request, uniqueEmail, 'password123456');

  // Call list users endpoint
  const response = await request.get(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.users).toBeDefined();
  expect(Array.isArray(data.users)).toBe(true);
  expect(data.users.length).toBe(0);
});

test('[LISTUSR-003] API List users returns all created managed users.', async ({ request }) => {
  // Register and login
  const authEmail = `test-list-auth-${Date.now()}@example.com`;
  await registerUser(request, authEmail, 'password123456');
  const token = await loginUser(request, authEmail, 'password123456');

  // Create multiple managed users
  const user1Email = `managed-user-1-${Date.now()}@example.com`;
  const user2Email = `managed-user-2-${Date.now()}@example.com`;

  await createManagedUser(request, token, user1Email, 'John', 'Doe');
  await createManagedUser(request, token, user2Email, 'Jane', 'Smith');

  // Call list users endpoint
  const response = await request.get(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.users).toBeDefined();
  expect(Array.isArray(data.users)).toBe(true);
  expect(data.users.length).toBeGreaterThanOrEqual(2);

  // Verify user properties
  const user1 = data.users.find(u => u.email === user1Email);
  const user2 = data.users.find(u => u.email === user2Email);

  expect(user1).toBeDefined();
  expect(user1.userId).toBeDefined();
  expect(user1.firstName).toBe('John');
  expect(user1.lastName).toBe('Doe');

  expect(user2).toBeDefined();
  expect(user2.userId).toBeDefined();
  expect(user2.firstName).toBe('Jane');
  expect(user2.lastName).toBe('Smith');
});

test('[LISTUSR-004] API List users includes userId, email, firstName, and lastName fields.', async ({
  request,
}) => {
  // Register and login
  const authEmail = `test-list-fields-${Date.now()}@example.com`;
  await registerUser(request, authEmail, 'password123456');
  const token = await loginUser(request, authEmail, 'password123456');

  // Create a managed user
  const managedEmail = `managed-user-fields-${Date.now()}@example.com`;
  const createResponse = await createManagedUser(
    request,
    token,
    managedEmail,
    'Alice',
    'Johnson',
  );
  expect(createResponse.status()).toBe(201);

  // Call list users endpoint
  const response = await request.get(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.users.length).toBeGreaterThan(0);

  // Check required fields in response
  const user = data.users[0];
  expect(user).toHaveProperty('userId');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('firstName');
  expect(user).toHaveProperty('lastName');

  // Verify field types
  expect(typeof user.userId).toBe('string');
  expect(typeof user.email).toBe('string');
  expect(typeof user.firstName).toBe('string');
  expect(typeof user.lastName).toBe('string');
});

test('[LISTUSR-005] API List users returns users in creation order.', async ({ request }) => {
  // Register and login
  const authEmail = `test-list-order-${Date.now()}@example.com`;
  await registerUser(request, authEmail, 'password123456');
  const token = await loginUser(request, authEmail, 'password123456');

  // Create managed users with delays
  const user1Email = `managed-order-1-${Date.now()}@example.com`;
  await createManagedUser(request, token, user1Email, 'First', 'User');

  await new Promise(resolve => setTimeout(resolve, 100));

  const user2Email = `managed-order-2-${Date.now()}@example.com`;
  await createManagedUser(request, token, user2Email, 'Second', 'User');

  // Call list users endpoint
  const response = await request.get(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();

  // Find the two users and verify order
  const user1Index = data.users.findIndex(u => u.email === user1Email);
  const user2Index = data.users.findIndex(u => u.email === user2Email);

  expect(user1Index).toBeGreaterThanOrEqual(0);
  expect(user2Index).toBeGreaterThanOrEqual(0);
  expect(user1Index).toBeLessThan(user2Index);
});

test('[LISTUSR-006] API List users with invalid token returns 401.', async ({ request }) => {
  const response = await request.get(`${API_URL}/users`, {
    headers: {
      Authorization: 'Bearer invalid-token-xyz',
    },
  });

  expect(response.status()).toBe(401);
  const data = await response.json();
  expect(data.error).toBe('invalid_token');
});
