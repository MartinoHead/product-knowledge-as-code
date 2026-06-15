import 'dotenv/config';

const DEFAULT_PORT = 3000;
const DEFAULT_API_VERSION = 'v1';
const DEFAULT_JWT_EXPIRES_IN_SEC = 60 * 60;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 120;
const DEFAULT_METRICS_ENABLED = true;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parsePort(value: string | undefined): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_PORT;
  }

  return parsed;
}

function parseApiVersion(value: string | undefined): string {
  const raw = (value || DEFAULT_API_VERSION).trim();
  const normalized = raw.replace(/^\/+|\/+$/g, '');

  return normalized || DEFAULT_API_VERSION;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseCorsAllowedOrigins(value: string | undefined): '*' | string[] {
  const raw = (value || '*').trim();

  if (!raw || raw === '*') {
    return '*';
  }

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : '*';
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT),
  apiVersion: parseApiVersion(process.env.API_VERSION),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-change-me',
  jwtExpiresInSec: parsePositiveInteger(process.env.JWT_EXPIRES_IN_SEC, DEFAULT_JWT_EXPIRES_IN_SEC),
  corsAllowedOrigins: parseCorsAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
  rateLimitWindowMs: parsePositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
  rateLimitMaxRequests: parsePositiveInteger(process.env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_RATE_LIMIT_MAX_REQUESTS),
  metricsEnabled: parseBoolean(process.env.METRICS_ENABLED, DEFAULT_METRICS_ENABLED),
};
