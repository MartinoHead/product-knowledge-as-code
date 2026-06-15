import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './routes/index.js';
import { env } from './config/env.js';
import { createOpenApiDocument } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import {
  corsMiddleware,
  rateLimitMiddleware,
  secureHeadersMiddleware,
} from './middleware/security.js';
import {
  observabilityMiddleware,
  renderMetricsText,
} from './middleware/observability.js';

const API_PREFIX_HEADER_NAME = 'x-api-prefix';
const API_DOCS_PATH = '/docs';
const OPEN_API_JSON_PATH = '/openapi.json';
const METRICS_PATH = '/metrics';

export function createApp() {
  const app = express();
  const apiPrefix = `/${env.apiVersion}`;
  const openApiDocument = createOpenApiDocument();

  app.use(requestIdMiddleware);
  app.use(secureHeadersMiddleware);
  app.use(corsMiddleware);
  app.use(rateLimitMiddleware);
  app.use(observabilityMiddleware);
  app.use(express.json());

  app.use((_req, res, next) => {
    res.setHeader(API_PREFIX_HEADER_NAME, apiPrefix);
    next();
  });

  app.get(OPEN_API_JSON_PATH, (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use(API_DOCS_PATH, swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.get('/', (_req, res) => {
    res.status(200).json({
      message: 'template-project API is running',
      version: env.apiVersion,
      docs: API_DOCS_PATH,
    });
  });

  if (env.metricsEnabled) {
    app.get(METRICS_PATH, (_req, res) => {
      res.type('text/plain; version=0.0.4').send(renderMetricsText());
    });
  }

  app.use(apiPrefix, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
