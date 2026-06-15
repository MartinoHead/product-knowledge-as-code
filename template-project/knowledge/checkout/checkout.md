# Checkout

## Intent
Enable users to complete purchases with clear validation and payment confirmation.

## Happy Path
- User has at least one item in cart.
- User enters shipping details and payment method.
- System authorizes payment.
- Order confirmation is shown.

## Expected Behavior
- Checkout proceeds only when cart and required fields are valid.
- Order is created only after successful payment authorization.
- Confirmation includes a traceable order reference for support follow-up.

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

<!-- AGENT-LAST-UPDATE:START -->
## Agent Update Note (Simulated)
- timestamp: 2026-05-31T06:32:14.074Z
- source: mock-pr-diff.txt
- impact: checkout
- keyword "checkout" matched: M src/payments/checkout-orchestrator.ts
<!-- AGENT-LAST-UPDATE:END -->
