import { expect, test } from '@playwright/test';
import { apiPost, attachRequestFailureLogger } from '../../helpers/api-helpers.js';

// Auto-generated API tests from synchronized knowledge (md/yaml/gherkin).
// Derived from API executable scenarios to keep behavior traceability aligned.
// When a test fails, request/response trace is printed to stderr.

attachRequestFailureLogger();

test('[REG-001] Email must be valid format.', async ({ request }) => {
  const response = await apiPost(request, '/v1/registration', {
    data: { email: 'invalid-email-format', password: 'valid-password-123' },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid_email', message: 'Email must be valid format.' });
});
