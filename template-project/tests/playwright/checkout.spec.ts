import { expect, test } from '@playwright/test';

test('[CHK-001] Checkout requires at least one cart item.', async ({ request }) => {
  const response = await request.post('/v1/checkout', {
    data: {
      items: [],
      shippingAddress: {
        line1: 'Main Street 1',
        city: 'Sofia',
        postalCode: '1000',
        country: 'BG',
      },
      paymentToken: 'pay_ok_1',
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    error: 'empty_cart',
    message: 'Checkout requires at least one cart item.',
  });
});

test('[CHK-002] Shipping address fields are mandatory.', async ({ request }) => {
  const response = await request.post('/v1/checkout', {
    data: {
      items: [{ sku: 'SKU-1', quantity: 1 }],
      shippingAddress: {
        line1: '',
        city: 'Sofia',
        postalCode: '1000',
        country: 'BG',
      },
      paymentToken: 'pay_ok_2',
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    error: 'invalid_shipping_address',
    message: 'Shipping address fields are mandatory.',
  });
});

test('[CHK-003] Payment authorization is required before order creation.', async ({ request }) => {
  const response = await request.post('/v1/checkout', {
    data: {
      items: [{ sku: 'SKU-1', quantity: 1 }],
      shippingAddress: {
        line1: 'Main Street 2',
        city: 'Sofia',
        postalCode: '1000',
        country: 'BG',
      },
      paymentToken: 'declined_token',
    },
  });

  expect(response.status()).toBe(402);
  expect(await response.json()).toEqual({
    error: 'payment_not_authorized',
    message: 'Payment authorization is required before order creation.',
  });
});

test('[CHK-004] Confirmation page includes order reference.', async ({ request }) => {
  const response = await request.post('/v1/checkout', {
    data: {
      items: [{ sku: 'SKU-1', quantity: 2 }],
      shippingAddress: {
        line1: 'Main Street 3',
        city: 'Sofia',
        postalCode: '1000',
        country: 'BG',
      },
      paymentToken: `pay_ok_${Date.now()}`,
    },
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.orderReference).toMatch(/^ord_\d+$/);
  expect(body.paymentAuthorized).toBe(true);
  expect(body.confirmation).toBe('Checkout completed successfully.');
});
