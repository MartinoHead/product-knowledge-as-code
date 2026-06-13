import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { env } from '../config/env.js';

const JWT_ALGORITHM = 'HS256';

type JwtPayload = {
  sub: string;
  iat: number;
  exp: number;
};

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): Buffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

function signSegment(segment: string, secret: string): string {
  return toBase64Url(createHmac('sha256', secret).update(segment).digest());
}

export function createJwtForUser(userId: string): string {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: JWT_ALGORITHM,
    typ: 'JWT',
  };

  const payload: JwtPayload = {
    sub: userId,
    iat: now,
    exp: now + env.jwtExpiresInSec,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signSegment(signingInput, env.jwtSecret);

  return `${signingInput}.${signature}`;
}

export function verifyJwtAndGetUserId(token: string): string | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signSegment(signingInput, env.jwtSecret);

  const candidateBuffer = Buffer.from(encodedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (candidateBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(candidateBuffer, expectedBuffer)) {
    return null;
  }

  let payload: Partial<JwtPayload>;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8')) as Partial<JwtPayload>;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number' || payload.exp <= now) {
    return null;
  }

  return payload.sub;
}
