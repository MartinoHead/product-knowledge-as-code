import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

// Reuse a single client instance across the application.
// In dev, attach to globalThis to survive hot-reloads without
// exhausting connection pool slots.
// Requires DATABASE_URL env var — copy .env.example to .env.

declare global {
  var __prisma: PrismaClient | undefined;
}

function getConnectionString(): string | null {
  const value = process.env.DATABASE_URL?.trim();
  return value ? value : null;
}

function createPrismaClient(): PrismaClient {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
        'Copy .env.example to .env and fill in the value.',
    );
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });
}

export function isPrismaConfigured(): boolean {
  return Boolean(getConnectionString());
}

export function getPrismaClient(): PrismaClient {
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient();
  }

  return globalThis.__prisma;
}

export function getPrismaClientIfConfigured(): PrismaClient | null {
  return isPrismaConfigured() ? getPrismaClient() : null;
}
