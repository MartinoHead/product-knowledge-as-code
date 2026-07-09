import { expect, test } from '@playwright/test';
import { apiGet, apiPost, attachRequestFailureLogger, authHeaders, uniqueEmail } from '../helpers/api-helpers.js';

// Auto-generated Playwright tests from synchronized knowledge (md/yaml/gherkin).
// Derived from API executable scenarios to keep behavior traceability aligned.
// When a test fails, request/response trace is printed to stderr.

attachRequestFailureLogger();

