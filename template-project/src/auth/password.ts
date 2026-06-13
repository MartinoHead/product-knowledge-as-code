import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

type PasswordHashParts = {
  algorithm: string;
  n: number;
  r: number;
  p: number;
  salt: string;
  digest: string;
};

function parseHash(storedHash: string): PasswordHashParts | null {
  const parts = storedHash.split('$');

  if (parts.length !== 6) {
    return null;
  }

  const [algorithm, nRaw, rRaw, pRaw, salt, digest] = parts;

  if (algorithm !== 'scrypt') {
    return null;
  }

  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);

  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || !salt || !digest) {
    return null;
  }

  return {
    algorithm,
    n,
    r,
    p,
    salt,
    digest,
  };
}

export function hashPassword(plainTextPassword: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plainTextPassword, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }).toString('hex');

  return ['scrypt', String(SCRYPT_N), String(SCRYPT_R), String(SCRYPT_P), salt, derived].join('$');
}

export function verifyPasswordHash(storedHash: string, plainTextPassword: string): boolean {
  const parsed = parseHash(storedHash);

  if (!parsed) {
    return false;
  }

  const candidate = scryptSync(plainTextPassword, parsed.salt, SCRYPT_KEY_LENGTH, {
    N: parsed.n,
    r: parsed.r,
    p: parsed.p,
  });

  const expected = Buffer.from(parsed.digest, 'hex');

  if (candidate.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(candidate, expected);
}
