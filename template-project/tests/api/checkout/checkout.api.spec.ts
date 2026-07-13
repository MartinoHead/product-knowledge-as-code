import { expect, test } from '@playwright/test';
import { apiGet, apiPost, attachRequestFailureLogger, authHeaders, uniqueEmail } from '../../helpers/api-helpers.js';

// Auto-generated API tests from synchronized knowledge (md/yaml/gherkin).
// Generator emits executable deterministic baseline scenarios.
// When a test fails, request/response trace is printed to stderr.

attachRequestFailureLogger();

test('[CHK-001] API Checkout requires at least one cart item.', async ({ request }) => {
  const response = await apiPost(request, '/v1/checkout', {
    data: { items: [], shippingAddress: { line1: 'Main', city: 'Sofia', postalCode: '1000', country: 'BG' }, paymentToken: 'pay_ok_1' },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'empty_cart', message: 'Checkout requires at least one cart item.' });
});

test('[CHK-002] API Shipping address fields are mandatory.', async ({ request }) => {
  const response = await apiPost(request, '/v1/checkout', {
    data: { items: [{ sku: 'SKU-1', quantity: 1 }], shippingAddress: { line1: '', city: 'Sofia', postalCode: '1000', country: 'BG' }, paymentToken: 'pay_ok_2' },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid_shipping_address', message: 'Shipping address fields are mandatory.' });
});

test('[CHK-003] API Payment authorization is required before order creation.', async ({ request }) => {
  const response = await apiPost(request, '/v1/checkout', {
    data: { items: [{ sku: 'SKU-1', quantity: 1 }], shippingAddress: { line1: 'Main', city: 'Sofia', postalCode: '1000', country: 'BG' }, paymentToken: 'declined_token' },
  });
  expect(response.status()).toBe(402);
  expect(await response.json()).toEqual({ error: 'payment_not_authorized', message: 'Payment authorization is required before order creation.' });
});

test('[CHK-004] API Confirmation page includes order reference.', async ({ request }) => {
  const response = await apiPost(request, '/v1/checkout', {
    data: { items: [{ sku: 'SKU-1', quantity: 2 }], shippingAddress: { line1: 'Main', city: 'Sofia', postalCode: '1000', country: 'BG' }, paymentToken: 'pay_ok_' + Date.now() },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.orderReference).toMatch(/^ord_\d+$/);
  expect(body.paymentAuthorized).toBe(true);
  expect(body.confirmation).toBe('Checkout completed successfully.');
});
