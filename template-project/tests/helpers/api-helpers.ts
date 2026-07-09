import { createJwtForUser } from '../../src/auth/jwt.js';

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

export function authHeaders(userId = 'usr_test_actor'): Record<string, string> {
  return {
    Authorization: `Bearer ${createJwtForUser(userId)}`,
  };
}
