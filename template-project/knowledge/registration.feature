Feature: Registration
  Product behavior for account creation and validation.

  @REG-001
  Scenario: Email must be valid format.
    Given a user is on the registration page
    When the user enters an invalid email format
    Then registration is blocked

  @REG-002
  Scenario: Email must be unique.
    Given an existing account uses the submitted email
    When the user submits registration
    Then a duplicate email error is shown

  @REG-003
  Scenario: Password length must be at least 8 characters.
    Given a user enters a password shorter than 8 characters
    When the user submits registration
    Then a password validation error is shown

  @REG-004
  Scenario: Verification email is sent after successful registration.
    Given a user submits valid unique registration credentials
    When registration succeeds
    Then a verification email is queued
