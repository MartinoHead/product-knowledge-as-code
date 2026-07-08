import { hashPassword, verifyPasswordHash } from '../auth/password.js';

export const MIN_PASSWORD_LENGTH = 10;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthUser = {
  userId: string;
  email: string;
  password: string;
  locked: boolean;
};

export type ManagedUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
};

const usersByEmail = new Map<string, AuthUser>();
const managedUsersById = new Map<string, ManagedUser>();
const managedUserIdByEmail = new Map<string, string>();
let userSequence = 0;

export function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export function createUser(email: string, password: string): AuthUser | null {
  if (usersByEmail.has(email)) {
    return null;
  }

  userSequence += 1;
  const user: AuthUser = {
    userId: `usr_${userSequence}`,
    email,
    password: hashPassword(password),
    locked: false,
  };

  usersByEmail.set(email, user);
  return user;
}

export function findUserByEmail(email: string): AuthUser | undefined {
  return usersByEmail.get(email);
}

export function verifyPassword(user: AuthUser, password: string): boolean {
  return verifyPasswordHash(user.password, password);
}

export function createManagedUser(input: {
  email: string;
  firstName: string;
  lastName: string;
}): ManagedUser | null {
  if (managedUserIdByEmail.has(input.email)) {
    return null;
  }

  userSequence += 1;
  const user: ManagedUser = {
    userId: `usr_${userSequence}`,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
  };

  managedUsersById.set(user.userId, user);
  managedUserIdByEmail.set(user.email, user.userId);
  return user;
}

export function findManagedUserById(userId: string): ManagedUser | undefined {
  return managedUsersById.get(userId);
}

export function listManagedUsers(): ManagedUser[] {
  return Array.from(managedUsersById.values());
}

export function extractBearerToken(authorizationHeader: unknown): string | null {
  const value = String(authorizationHeader || '').trim();
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
