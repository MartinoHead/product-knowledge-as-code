import { randomUUID } from 'node:crypto';
import { hashPassword } from '../auth/password.js';
import {
  createManagedUser as createManagedUserInMemory,
  createUser as createUserInMemory,
  findManagedUserById as findManagedUserByIdInMemory,
  findUserByEmail as findUserByEmailInMemory,
  listManagedUsers as listManagedUsersInMemory,
  type AuthUser,
  type ManagedUser,
} from '../data/in-memory-auth-store.js';
import { getPrismaClientIfConfigured } from '../data/prisma-client.js';

type AuthUserRow = {
  publicId: string;
  email: string;
  password: string;
  locked: boolean;
};

type ManagedUserRow = {
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
};

function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if ('code' in error && (error as { code?: unknown }).code === 'P1001') {
    return true;
  }

  const message = 'message' in error ? String((error as { message?: unknown }).message || '') : '';
  return message.includes("Can't reach database server");
}

function parseNumericSuffix(value: string, prefix: string): number {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : '';
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function nextPublicId(tableName: 'AuthUser' | 'ManagedUser', prefix: string): Promise<string> {
  const prisma = getPrismaClientIfConfigured();

  if (!prisma) {
    throw new Error('Prisma client is not configured.');
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ publicId: string }>>(
    `SELECT "publicId" FROM "${tableName}"`,
  );

  const nextValue = rows.reduce((maxValue, row) => {
    return Math.max(maxValue, parseNumericSuffix(row.publicId, prefix));
  }, 0);

  return `${prefix}${nextValue + 1}`;
}

function mapAuthUser(row: AuthUserRow): AuthUser {
  return {
    userId: row.publicId,
    email: row.email,
    password: row.password,
    locked: row.locked,
  };
}

function mapManagedUser(row: ManagedUserRow): ManagedUser {
  return {
    userId: row.publicId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
  };
}

export async function createAuthUser(email: string, password: string): Promise<AuthUser | null> {
  const prisma = getPrismaClientIfConfigured();

  if (!prisma) {
    return createUserInMemory(email, password);
  }

  try {
    const existingUsers = await prisma.$queryRawUnsafe<AuthUserRow[]>(
      'SELECT "publicId", email, password, locked FROM "AuthUser" WHERE email = $1 LIMIT 1',
      email,
    );

    if (existingUsers.length > 0) {
      return null;
    }

    const publicId = await nextPublicId('AuthUser', 'usr_');

    await prisma.$executeRawUnsafe(
      [
        'INSERT INTO "AuthUser" (id, "publicId", email, password, locked, "createdAt", "updatedAt")',
        'VALUES ($1, $2, $3, $4, $5, $6, $7)',
      ].join(' '),
      randomUUID(),
      publicId,
      email,
      hashPassword(password),
      false,
      new Date(),
      new Date(),
    );

    const createdUsers = await prisma.$queryRawUnsafe<AuthUserRow[]>(
      'SELECT "publicId", email, password, locked FROM "AuthUser" WHERE email = $1 LIMIT 1',
      email,
    );

    return createdUsers[0] ? mapAuthUser(createdUsers[0]) : null;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return createUserInMemory(email, password);
    }
    throw error;
  }
}

export async function findAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
  const prisma = getPrismaClientIfConfigured();

  if (!prisma) {
    return findUserByEmailInMemory(email);
  }

  try {
    const rows = await prisma.$queryRawUnsafe<AuthUserRow[]>(
      'SELECT "publicId", email, password, locked FROM "AuthUser" WHERE email = $1 LIMIT 1',
      email,
    );

    return rows[0] ? mapAuthUser(rows[0]) : undefined;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return findUserByEmailInMemory(email);
    }
    throw error;
  }
}

export async function createManagedUser(input: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<ManagedUser | null> {
  const prisma = getPrismaClientIfConfigured();

  if (!prisma) {
    return createManagedUserInMemory(input);
  }

  try {
    const existingUsers = await prisma.$queryRawUnsafe<ManagedUserRow[]>(
      'SELECT "publicId", email, "firstName", "lastName" FROM "ManagedUser" WHERE email = $1 LIMIT 1',
      input.email,
    );

    if (existingUsers.length > 0) {
      return null;
    }

    const publicId = await nextPublicId('ManagedUser', 'usr_');

    await prisma.$executeRawUnsafe(
      [
        'INSERT INTO "ManagedUser" (id, "publicId", email, "firstName", "lastName", "createdAt", "updatedAt")',
        'VALUES ($1, $2, $3, $4, $5, $6, $7)',
      ].join(' '),
      randomUUID(),
      publicId,
      input.email,
      input.firstName,
      input.lastName,
      new Date(),
      new Date(),
    );

    const createdUsers = await prisma.$queryRawUnsafe<ManagedUserRow[]>(
      'SELECT "publicId", email, "firstName", "lastName" FROM "ManagedUser" WHERE email = $1 LIMIT 1',
      input.email,
    );

    return createdUsers[0] ? mapManagedUser(createdUsers[0]) : null;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return createManagedUserInMemory(input);
    }
    throw error;
  }
}

export async function findManagedUserById(userId: string): Promise<ManagedUser | undefined> {
  const prisma = getPrismaClientIfConfigured();

  if (!prisma) {
    return findManagedUserByIdInMemory(userId);
  }

  try {
    const rows = await prisma.$queryRawUnsafe<ManagedUserRow[]>(
      'SELECT "publicId", email, "firstName", "lastName" FROM "ManagedUser" WHERE "publicId" = $1 LIMIT 1',
      userId,
    );

    return rows[0] ? mapManagedUser(rows[0]) : undefined;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return findManagedUserByIdInMemory(userId);
    }
    throw error;
  }
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const prisma = getPrismaClientIfConfigured();

  if (!prisma) {
    return listManagedUsersInMemory();
  }

  try {
    const rows = await prisma.$queryRawUnsafe<ManagedUserRow[]>(
      'SELECT "publicId", email, "firstName", "lastName" FROM "ManagedUser" ORDER BY "createdAt" ASC',
    );

    return rows.map(mapManagedUser);
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return listManagedUsersInMemory();
    }
    throw error;
  }
}