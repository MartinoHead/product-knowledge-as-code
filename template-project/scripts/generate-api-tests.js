const fs = require('fs');
const path = require('path');
const { getFeatureRules, verifyKnowledgeSync } = require('./knowledge-utils');

const knowledgeDir = path.join(__dirname, '..', 'knowledge');
const testDir = path.join(__dirname, '..', 'tests', 'api');

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

const { issues, bundle } = verifyKnowledgeSync(knowledgeDir);
if (issues.length) {
  console.error('Knowledge is not synchronized across md/yaml/gherkin:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

function escapeText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderApiTest(featureName, id, text) {
  const title = `[${id}] API ${text}`;

  if (featureName === 'registration') {
    if (id === 'REG-001') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/registration', {\n` +
        `    data: { email: 'invalid-email-format', password: 'valid-password-123' },\n` +
        `  });\n` +
        `  expect(response.status()).toBe(400);\n` +
        `  expect(await response.json()).toEqual({ error: 'invalid_email', message: 'Email must be valid format.' });\n` +
        `});\n`;
    }

    if (id === 'REG-002') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const email = uniqueEmail('reg-duplicate');\n` +
        `  const first = await request.post('/v1/registration', { data: { email, password: 'valid-password-123' } });\n` +
        `  expect([201, 503]).toContain(first.status());\n` +
        `  if (first.status() === 503) {\n` +
        `    expect(await first.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  const second = await request.post('/v1/registration', { data: { email, password: 'valid-password-123' } });\n` +
        `  expect(second.status()).toBe(409);\n` +
        `  expect(await second.json()).toEqual({ error: 'duplicate_email', message: 'Email already registered.' });\n` +
        `});\n`;
    }

    if (id === 'REG-003') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/registration', {\n` +
        `    data: { email: uniqueEmail('reg-short-pass'), password: 'short' },\n` +
        `  });\n` +
        `  expect(response.status()).toBe(400);\n` +
        `  expect(await response.json()).toEqual({ error: 'invalid_password', message: 'Password length must be at least 10 characters.' });\n` +
        `});\n`;
    }

    if (id === 'REG-004') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/registration', {\n` +
        `    data: { email: uniqueEmail('reg-success'), password: 'valid-password-123' },\n` +
        `  });\n` +
        `  expect([201, 503]).toContain(response.status());\n` +
        `  if (response.status() === 503) {\n` +
        `    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  const body = await response.json();\n` +
        `  expect(body.userId).toMatch(/^usr_\\d+$/);\n` +
        `  expect(body.verificationEmailQueued).toBe(true);\n` +
        `});\n`;
    }

    return `test('${escapeText(title)}', async ({ request }) => {\n` +
      `  const response = await request.post('/v1/registration', { data: ['not-an-object'] });\n` +
      `  expect(response.status()).toBe(400);\n` +
      `  expect(await response.json()).toEqual({ error: 'invalid_request', message: 'Request body must be a JSON object.' });\n` +
      `});\n`;
  }

  if (featureName === 'login') {
    if (id === 'LGN-001') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/login', {\n` +
        `    data: { email: uniqueEmail('login-missing-user'), password: 'valid-password-123' },\n` +
        `  });\n` +
        `  expect([401, 503]).toContain(response.status());\n` +
        `  if (response.status() === 503) {\n` +
        `    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  expect(await response.json()).toEqual({ error: 'invalid_credentials', message: 'Invalid credentials.' });\n` +
        `});\n`;
    }

    if (id === 'LGN-002') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const email = uniqueEmail('login-wrong-password');\n` +
        `  const password = 'valid-password-123';\n` +
        `  const reg = await request.post('/v1/registration', { data: { email, password } });\n` +
        `  expect([201, 503]).toContain(reg.status());\n` +
        `  if (reg.status() === 503) {\n` +
        `    expect(await reg.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  const response = await request.post('/v1/login', { data: { email, password: 'wrong-password-999' } });\n` +
        `  expect(response.status()).toBe(401);\n` +
        `  expect(await response.json()).toEqual({ error: 'invalid_credentials', message: 'Invalid credentials.' });\n` +
        `});\n`;
    }

    if (id === 'LGN-003') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const email = uniqueEmail('login-success');\n` +
        `  const password = 'valid-password-123';\n` +
        `  const reg = await request.post('/v1/registration', { data: { email, password } });\n` +
        `  expect([201, 503]).toContain(reg.status());\n` +
        `  if (reg.status() === 503) {\n` +
        `    expect(await reg.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  const response = await request.post('/v1/login', { data: { email, password } });\n` +
        `  expect(response.status()).toBe(200);\n` +
        `  const body = await response.json();\n` +
        `  expect(body.tokenType).toBe('Bearer');\n` +
        `  expect(body.active).toBe(true);\n` +
        `  expect(body.sessionToken).toMatch(/^eyJ/);\n` +
        `});\n`;
    }

    return `test('${escapeText(title)}', async ({ request }) => {\n` +
      `  const response = await request.post('/v1/login', { data: ['not-an-object'] });\n` +
      `  expect(response.status()).toBe(400);\n` +
      `  expect(await response.json()).toEqual({ error: 'invalid_request', message: 'Request body must be a JSON object.' });\n` +
      `});\n`;
  }

  if (featureName === 'create-user') {
    if (id === 'USR-001') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/users', {\n` +
        `    data: { email: uniqueEmail('users-unauthorized'), firstName: 'Unauth', lastName: 'User' },\n` +
        `  });\n` +
        `  expect(response.status()).toBe(401);\n` +
        `  expect(await response.json()).toEqual({ error: 'unauthorized', message: 'Authorization required.' });\n` +
        `});\n`;
    }

    if (id === 'USR-002') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const email = uniqueEmail('users-duplicate');\n` +
        `  const first = await request.post('/v1/users', { headers: authHeaders(), data: { email, firstName: 'First', lastName: 'User' } });\n` +
        `  expect([201, 503]).toContain(first.status());\n` +
        `  if (first.status() === 503) {\n` +
        `    expect(await first.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  const second = await request.post('/v1/users', { headers: authHeaders(), data: { email, firstName: 'Second', lastName: 'User' } });\n` +
        `  expect(second.status()).toBe(409);\n` +
        `  expect(await second.json()).toEqual({ error: 'duplicate_email', message: 'Email already exists.' });\n` +
        `});\n`;
    }

    if (id === 'USR-003') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/users', {\n` +
        `    headers: authHeaders(),\n` +
        `    data: { email: uniqueEmail('users-success'), firstName: 'Happy', lastName: 'Path' },\n` +
        `  });\n` +
        `  expect([201, 503]).toContain(response.status());\n` +
        `  if (response.status() === 503) {\n` +
        `    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  const body = await response.json();\n` +
        `  expect(body.userId).toMatch(/^usr_\\d+$/);\n` +
        `});\n`;
    }

    return `test('${escapeText(title)}', async ({ request }) => {\n` +
      `  const response = await request.post('/v1/users', { headers: authHeaders(), data: ['not-an-object'] });\n` +
      `  expect(response.status()).toBe(400);\n` +
      `  expect(await response.json()).toEqual({ error: 'invalid_request', message: 'Request body must be a JSON object.' });\n` +
      `});\n`;
  }

  if (featureName === 'get-user') {
    if (id === 'USG-001') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.get('/v1/users/usr_999');\n` +
        `  expect(response.status()).toBe(401);\n` +
        `  expect(await response.json()).toEqual({ error: 'unauthorized', message: 'Authorization required.' });\n` +
        `});\n`;
    }

    if (id === 'USG-002') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.get('/v1/users/usr_missing', { headers: authHeaders() });\n` +
        `  expect([404, 503]).toContain(response.status());\n` +
        `  if (response.status() === 503) {\n` +
        `    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  expect(await response.json()).toEqual({ error: 'not_found', message: 'User not found.' });\n` +
        `});\n`;
    }

    if (id === 'USG-003') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const created = await request.post('/v1/users', {\n` +
        `    headers: authHeaders(),\n` +
        `    data: { email: uniqueEmail('get-user-success'), firstName: 'Get', lastName: 'User' },\n` +
        `  });\n` +
        `  expect([201, 503]).toContain(created.status());\n` +
        `  if (created.status() === 503) {\n` +
        `    expect(await created.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  const { userId } = await created.json();\n` +
        `  const response = await request.get('/v1/users/' + userId, { headers: authHeaders() });\n` +
        `  expect(response.status()).toBe(200);\n` +
        `  const body = await response.json();\n` +
        `  expect(body.userId).toBe(userId);\n` +
        `  expect(typeof body.email).toBe('string');\n` +
        `  expect(typeof body.firstName).toBe('string');\n` +
        `  expect(typeof body.lastName).toBe('string');\n` +
        `});\n`;
    }

    return `test('${escapeText(title)}', async ({ request }) => {\n` +
      `  const response = await request.get('/v1/users/usr_missing', { headers: authHeaders() });\n` +
      `  expect([404, 503]).toContain(response.status());\n` +
      `});\n`;
  }

  if (featureName === 'list-users') {
    if (id === 'LISTUSR-001') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.get('/v1/users');\n` +
        `  expect(response.status()).toBe(401);\n` +
        `  expect(await response.json()).toEqual({ error: 'unauthorized', message: 'Authorization required.' });\n` +
        `});\n`;
    }

    if (id === 'LISTUSR-002') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.get('/v1/users', { headers: authHeaders('usr_list_empty') });\n` +
        `  expect([200, 503]).toContain(response.status());\n` +
        `  if (response.status() === 503) {\n` +
        `    expect(await response.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  const body = await response.json();\n` +
        `  expect(Array.isArray(body.users)).toBe(true);\n` +
        `});\n`;
    }

    if (id === 'LISTUSR-003') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const a = uniqueEmail('list-a');\n` +
        `  const b = uniqueEmail('list-b');\n` +
        `  const first = await request.post('/v1/users', { headers: authHeaders(), data: { email: a, firstName: 'List', lastName: 'A' } });\n` +
        `  expect([201, 503]).toContain(first.status());\n` +
        `  if (first.status() === 503) {\n` +
        `    expect(await first.json()).toEqual({ error: 'service_unavailable', message: 'Persistent identity storage is unavailable. Try again later.' });\n` +
        `    return;\n` +
        `  }\n` +
        `  await request.post('/v1/users', { headers: authHeaders(), data: { email: b, firstName: 'List', lastName: 'B' } });\n` +
        `  const list = await request.get('/v1/users', { headers: authHeaders() });\n` +
        `  expect(list.status()).toBe(200);\n` +
        `  const emails = (await list.json()).users.map((u) => u.email);\n` +
        `  expect(emails).toContain(a);\n` +
        `  expect(emails).toContain(b);\n` +
        `});\n`;
    }

    if (id === 'LISTUSR-004') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.get('/v1/users', { headers: authHeaders('usr_list_fields') });\n` +
        `  expect([200, 503]).toContain(response.status());\n` +
        `  if (response.status() === 503) return;\n` +
        `  for (const user of (await response.json()).users) {\n` +
        `    expect(typeof user.userId).toBe('string');\n` +
        `    expect(typeof user.email).toBe('string');\n` +
        `    expect(typeof user.firstName).toBe('string');\n` +
        `    expect(typeof user.lastName).toBe('string');\n` +
        `  }\n` +
        `});\n`;
    }

    if (id === 'LISTUSR-005') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const firstEmail = uniqueEmail('order-first');\n` +
        `  const secondEmail = uniqueEmail('order-second');\n` +
        `  const first = await request.post('/v1/users', { headers: authHeaders(), data: { email: firstEmail, firstName: 'Order', lastName: 'First' } });\n` +
        `  expect([201, 503]).toContain(first.status());\n` +
        `  if (first.status() === 503) return;\n` +
        `  await request.post('/v1/users', { headers: authHeaders(), data: { email: secondEmail, firstName: 'Order', lastName: 'Second' } });\n` +
        `  const list = await request.get('/v1/users', { headers: authHeaders() });\n` +
        `  const body = await list.json();\n` +
        `  const firstIndex = body.users.findIndex((u) => u.email === firstEmail);\n` +
        `  const secondIndex = body.users.findIndex((u) => u.email === secondEmail);\n` +
        `  expect(firstIndex).toBeGreaterThanOrEqual(0);\n` +
        `  expect(secondIndex).toBeGreaterThanOrEqual(0);\n` +
        `  expect(firstIndex).toBeLessThan(secondIndex);\n` +
        `});\n`;
    }

    if (id === 'LISTUSR-006') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.get('/v1/users', { headers: { Authorization: 'Bearer invalid-token' } });\n` +
        `  expect(response.status()).toBe(401);\n` +
        `  expect(await response.json()).toEqual({ error: 'unauthorized', message: 'Authorization required.' });\n` +
        `});\n`;
    }

    return `test('${escapeText(title)}', async ({ request }) => {\n` +
      `  const response = await request.get('/v1/users', { headers: authHeaders() });\n` +
      `  expect([200, 503]).toContain(response.status());\n` +
      `});\n`;
  }

  if (featureName === 'checkout') {
    if (id === 'CHK-001') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/checkout', {\n` +
        `    data: { items: [], shippingAddress: { line1: 'Main', city: 'Sofia', postalCode: '1000', country: 'BG' }, paymentToken: 'pay_ok_1' },\n` +
        `  });\n` +
        `  expect(response.status()).toBe(400);\n` +
        `  expect(await response.json()).toEqual({ error: 'empty_cart', message: 'Checkout requires at least one cart item.' });\n` +
        `});\n`;
    }

    if (id === 'CHK-002') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/checkout', {\n` +
        `    data: { items: [{ sku: 'SKU-1', quantity: 1 }], shippingAddress: { line1: '', city: 'Sofia', postalCode: '1000', country: 'BG' }, paymentToken: 'pay_ok_2' },\n` +
        `  });\n` +
        `  expect(response.status()).toBe(400);\n` +
        `  expect(await response.json()).toEqual({ error: 'invalid_shipping_address', message: 'Shipping address fields are mandatory.' });\n` +
        `});\n`;
    }

    if (id === 'CHK-003') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/checkout', {\n` +
        `    data: { items: [{ sku: 'SKU-1', quantity: 1 }], shippingAddress: { line1: 'Main', city: 'Sofia', postalCode: '1000', country: 'BG' }, paymentToken: 'declined_token' },\n` +
        `  });\n` +
        `  expect(response.status()).toBe(402);\n` +
        `  expect(await response.json()).toEqual({ error: 'payment_not_authorized', message: 'Payment authorization is required before order creation.' });\n` +
        `});\n`;
    }

    if (id === 'CHK-004') {
      return `test('${escapeText(title)}', async ({ request }) => {\n` +
        `  const response = await request.post('/v1/checkout', {\n` +
        `    data: { items: [{ sku: 'SKU-1', quantity: 2 }], shippingAddress: { line1: 'Main', city: 'Sofia', postalCode: '1000', country: 'BG' }, paymentToken: 'pay_ok_' + Date.now() },\n` +
        `  });\n` +
        `  expect(response.status()).toBe(201);\n` +
        `  const body = await response.json();\n` +
        `  expect(body.orderReference).toMatch(/^ord_\\d+$/);\n` +
        `  expect(body.paymentAuthorized).toBe(true);\n` +
        `  expect(body.confirmation).toBe('Checkout completed successfully.');\n` +
        `});\n`;
    }

    return `test('${escapeText(title)}', async ({ request }) => {\n` +
      `  const response = await request.post('/v1/checkout', { data: ['not-an-object'] });\n` +
      `  expect(response.status()).toBe(400);\n` +
      `});\n`;
  }

  return `test('${escapeText(title)}', async ({ request }) => {\n` +
    `  const response = await request.get('/v1/health');\n` +
    `  expect(response.status()).toBe(200);\n` +
    `});\n`;
}

for (const feature of bundle) {
  const ruleEntries = getFeatureRules(feature);
  const specBaseName = feature.featureName.replace(/[\\/]/g, '-');
  const featureDir = path.join(testDir, specBaseName);
  const outFile = path.join(featureDir, `${specBaseName}.api.spec.ts`);

  if (!fs.existsSync(featureDir)) {
    fs.mkdirSync(featureDir, { recursive: true });
  }

  const tests = ruleEntries
    .map(([id, text]) => renderApiTest(specBaseName, id, text))
    .join('\n')
    .replace(/request\.post\(/g, 'apiPost(request, ')
    .replace(/request\.get\(/g, 'apiGet(request, ');

  const content =
    `import { expect, test } from '@playwright/test';\n` +
    `import { apiGet, apiPost, attachRequestFailureLogger, authHeaders, uniqueEmail } from '../../helpers/api-helpers.js';\n\n` +
    `// Auto-generated API tests from synchronized knowledge (md/yaml/gherkin).\n` +
    `// Generator emits executable deterministic baseline scenarios.\n` +
    `// When a test fails, request/response trace is printed to stderr.\n\n` +
    `attachRequestFailureLogger();\n\n` +
    tests;

  fs.writeFileSync(outFile, content, 'utf8');
  console.log(`Generated ${path.relative(process.cwd(), outFile)}`);
}
