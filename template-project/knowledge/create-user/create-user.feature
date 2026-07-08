Feature: Create User
  Product behavior for create user.

  @USR-001
  Scenario: Create user requires authorization.
    Given rule USR-001 preconditions are satisfied
    When the actor executes create user
    Then system behavior matches the rule statement

  @USR-002
  Scenario: Create user requires unique email.
    Given rule USR-002 preconditions are satisfied
    When the actor executes create user
    Then system behavior matches the rule statement

  @USR-003
  Scenario: Successful create user returns created user identifier.
    Given rule USR-003 preconditions are satisfied
    When the actor executes create user
    Then system behavior matches the rule statement
