# Checkout

## Intent
Enable users to complete purchases with clear validation and payment confirmation.

## Happy Path
- User has at least one item in cart.
- User enters shipping details and payment method.
- System authorizes payment.
- Order confirmation is shown.

## Rules
- CHK-001: Checkout requires at least one cart item.
- CHK-002: Shipping address fields are mandatory.
- CHK-003: Payment authorization is required before order creation.
- CHK-004: Confirmation page includes order reference.

## Edge Cases
- Empty cart: checkout action is disabled.
- Payment declined: order is not created and error is shown.

## Non-Goals
- Tax calculation rules.
