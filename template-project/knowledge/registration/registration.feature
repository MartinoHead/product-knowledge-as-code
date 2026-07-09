Feature: Registration
  Product behavior for registration.

  @REG-001
  Scenario: Email must be valid format.
    Given rule REG-001 preconditions are satisfied
    When the actor executes registration
    Then system behavior matches the rule statement

  @REG-002
  Scenario: Email must be unique.
    Given rule REG-002 preconditions are satisfied
    When the actor executes registration
    Then system behavior matches the rule statement

  @REG-003
  Scenario: Password length must be at least 10 characters.
    Given rule REG-003 preconditions are satisfied
    When the actor executes registration
    Then system behavior matches the rule statement

  @REG-004
  Scenario: Verification email is sent after successful registration.
    Given rule REG-004 preconditions are satisfied
    When the actor executes registration
    Then system behavior matches the rule statement

  @REG-005
  Scenario: Document behavior change inferred from PR impact for registration. Source signal: keyword "registration" matched: type RegistrationResult =.
    Given rule REG-005 preconditions are satisfied
    When the actor executes registration
    Then system behavior matches the rule statement
