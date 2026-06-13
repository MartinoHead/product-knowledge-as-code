import { type ErrorRequestHandler, type RequestHandler } from 'express';
import { HttpError } from './http-error.js';

function isJsonSyntaxError(error: unknown): boolean {
  return error instanceof SyntaxError;
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Resource not found.',
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;

  if (res.headersSent) {
    return;
  }

  if (isJsonSyntaxError(error)) {
    res.status(400).json({
      error: 'invalid_json',
      message: 'Request body must be valid JSON.',
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.errorCode,
      message: error.publicMessage,
    });
    return;
  }

  res.status(500).json({
    error: 'internal_error',
    message: 'Unexpected server error.',
  });
};
