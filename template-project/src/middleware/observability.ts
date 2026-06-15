import { type NextFunction, type Request, type Response } from 'express';

type Counters = {
  requestsTotal: number;
  responsesTotal: number;
  errorsTotal: number;
  inFlight: number;
  durationMsTotal: number;
};

const REQUEST_ID_HEADER = 'x-request-id';

const counters: Counters = {
  requestsTotal: 0,
  responsesTotal: 0,
  errorsTotal: 0,
  inFlight: 0,
  durationMsTotal: 0,
};

const statusBuckets = new Map<string, number>();

function observeStatus(statusCode: number) {
  const bucket = `${Math.floor(statusCode / 100)}xx`;
  statusBuckets.set(bucket, (statusBuckets.get(bucket) || 0) + 1);
}

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  counters.requestsTotal += 1;
  counters.inFlight += 1;

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - start;
    const durationMs = Number(elapsedNs) / 1_000_000;

    counters.inFlight = Math.max(0, counters.inFlight - 1);
    counters.responsesTotal += 1;
    counters.durationMsTotal += durationMs;

    observeStatus(res.statusCode);

    if (res.statusCode >= 500) {
      counters.errorsTotal += 1;
    }

    const requestId = res.getHeader(REQUEST_ID_HEADER);
    const payload = {
      level: 'info',
      event: 'http_request',
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      requestId: typeof requestId === 'string' ? requestId : undefined,
    };

    console.log(JSON.stringify(payload));
  });

  next();
}

export function renderMetricsText(): string {
  const averageDurationMs =
    counters.responsesTotal > 0 ? counters.durationMsTotal / counters.responsesTotal : 0;

  const lines = [
    '# HELP http_requests_total Total number of incoming HTTP requests.',
    '# TYPE http_requests_total counter',
    `http_requests_total ${counters.requestsTotal}`,
    '# HELP http_responses_total Total number of completed HTTP responses.',
    '# TYPE http_responses_total counter',
    `http_responses_total ${counters.responsesTotal}`,
    '# HELP http_errors_total Total number of 5xx responses.',
    '# TYPE http_errors_total counter',
    `http_errors_total ${counters.errorsTotal}`,
    '# HELP http_in_flight Number of requests currently in flight.',
    '# TYPE http_in_flight gauge',
    `http_in_flight ${counters.inFlight}`,
    '# HELP http_request_duration_average_ms Average response duration in milliseconds.',
    '# TYPE http_request_duration_average_ms gauge',
    `http_request_duration_average_ms ${averageDurationMs.toFixed(2)}`,
  ];

  for (const [bucket, count] of statusBuckets.entries()) {
    lines.push(`http_responses_by_status_total{status="${bucket}"} ${count}`);
  }

  return `${lines.join('\n')}\n`;
}
