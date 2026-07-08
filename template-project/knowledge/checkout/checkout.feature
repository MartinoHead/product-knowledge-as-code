Feature: Checkout
  Product behavior for checkout.

  @CHK-001
  Scenario: Checkout requires at least one cart item.
    Given rule CHK-001 preconditions are satisfied
    When the actor executes checkout
    Then system behavior matches the rule statement

  @CHK-002
  Scenario: Shipping address fields are mandatory.
    Given rule CHK-002 preconditions are satisfied
    When the actor executes checkout
    Then system behavior matches the rule statement

  @CHK-003
  Scenario: Payment authorization is required before order creation.
    Given rule CHK-003 preconditions are satisfied
    When the actor executes checkout
    Then system behavior matches the rule statement

  @CHK-004
  Scenario: Confirmation page includes order reference.
    Given rule CHK-004 preconditions are satisfied
    When the actor executes checkout
    Then system behavior matches the rule statement

  @CHK-005
  Scenario: Document behavior change inferred from PR impact for checkout. Source signal: keyword "checkout" matched: M src/payments/checkout-orchestrator.ts.
    Given rule CHK-005 preconditions are satisfied
    When the actor executes checkout
    Then system behavior matches the rule statement
