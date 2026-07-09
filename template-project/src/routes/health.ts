import { Router } from 'express';
import { getPrismaClientIfConfigured } from '../data/prisma-client.js';

export const healthRouter = Router();

type DatabaseHealth = {
  configured: boolean;
  reachable: boolean;
  status: 'up' | 'down' | 'not_configured';
  latencyMs: number | null;
  error: string | null;
};

async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const prisma = getPrismaClientIfConfigured();
  const dbCheckStart = Date.now();

  const database: DatabaseHealth = {
    configured: Boolean(prisma),
    reachable: false,
    status: 'not_configured',
    latencyMs: null,
    error: null,
  };

  if (prisma) {
    try {
      await prisma.$queryRawUnsafe('SELECT 1');
      database.reachable = true;
      database.status = 'up';
      database.latencyMs = Date.now() - dbCheckStart;
    } catch (error) {
      database.status = 'down';
      database.latencyMs = Date.now() - dbCheckStart;
      database.error = error instanceof Error ? error.message : String(error);
      console.error(
        JSON.stringify({
          event: 'database_health_check_failed',
          status: database.status,
          latencyMs: database.latencyMs,
          error: database.error,
        }),
      );
    }
  }

  return database;
}

healthRouter.get('/health', async (_req, res) => {
  const database = await getDatabaseHealth();

  res.status(200).json({
    status: database.configured && !database.reachable ? 'degraded' : 'ok',
    service: 'template-project-api',
    timestamp: new Date().toISOString(),
    database,
  });
});

healthRouter.get('/ready', async (_req, res) => {
  const database = await getDatabaseHealth();
  const ready = database.configured && database.reachable;

  if (ready) {
    res.status(200).json({
      status: 'ready',
      service: 'template-project-api',
      timestamp: new Date().toISOString(),
      database,
    });
    return;
  }

  res.status(503).json({
    status: 'not_ready',
    service: 'template-project-api',
    timestamp: new Date().toISOString(),
    reason: database.configured ? 'database_unreachable' : 'database_not_configured',
    database,
  });
});
