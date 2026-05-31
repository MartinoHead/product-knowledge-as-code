Feature: Checkout
  Product behavior for purchase completion.

  @CHK-001
  Scenario: Checkout requires at least one cart item.
    Given a user has an empty cart
    When the user starts checkout
    Then checkout is blocked

  @CHK-002
  Scenario: Shipping address fields are mandatory.
    Given a user enters incomplete shipping details
    When the user submits checkout
    Then shipping validation errors are shown

  @CHK-003
  Scenario: Payment authorization is required before order creation.
    Given payment authorization fails
    When checkout is submitted
    Then no order is created

  @CHK-004
  Scenario: Confirmation page includes order reference.
    Given payment is authorized and order is created
    When checkout completes
    Then the confirmation page shows an order reference
