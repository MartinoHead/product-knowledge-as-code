import { EMAIL_PATTERN, normalizeEmail, type ManagedUser } from '../data/in-memory-auth-store.js';
import {
  createManagedUser as createManagedUserRecord,
  findManagedUserById as findManagedUserRecordById,
  listManagedUsers as listManagedUsersRecord,
} from '../repositories/identity-repository.js';

type CreateManagedUserResult =
  | { status: 201; body: { userId: string } }
  | { status: 400; body: { error: 'invalid_request'; message: string } }
  | { status: 409; body: { error: 'duplicate_email'; message: string } };

type GetManagedUserResult =
  | { status: 200; body: ManagedUser }
  | { status: 404; body: { error: 'not_found'; message: string } };

type ListManagedUsersResult = { status: 200; body: { users: ManagedUser[] } };

export async function createManagedUser(input: {
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
}): Promise<CreateManagedUserResult> {
  const email = normalizeEmail(input.email);
  const firstName = String(input.firstName || '').trim();
  const lastName = String(input.lastName || '').trim();

  if (!EMAIL_PATTERN.test(email) || !firstName || !lastName) {
    return {
      status: 400,
      body: {
        error: 'invalid_request',
        message: 'Email, firstName, and lastName are required.',
      },
    };
  }

  const user = await createManagedUserRecord({
    email,
    firstName,
    lastName,
  });

  if (!user) {
    return {
      status: 409,
      body: {
        error: 'duplicate_email',
        message: 'Email already exists.',
      },
    };
  }

  return {
    status: 201,
    body: {
      userId: user.userId,
    },
  };
}

export async function getManagedUserById(userId: string): Promise<GetManagedUserResult> {
  const user = await findManagedUserRecordById(userId);

  if (!user) {
    return {
      status: 404,
      body: {
        error: 'not_found',
        message: 'User not found.',
      },
    };
  }

  return {
    status: 200,
    body: user,
  };
}

export async function listManagedUsers(): Promise<ListManagedUsersResult> {
  const users = await listManagedUsersRecord();
  return {
    status: 200,
    body: { users },
  };
}