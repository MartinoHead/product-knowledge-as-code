Feature: Get User
  Product behavior for get user.

  @USG-001
  Scenario: Get user requires authorization.
    Given rule USG-001 preconditions are satisfied
    When the actor executes get user
    Then system behavior matches the rule statement

  @USG-002
  Scenario: Get user requires existing user identifier.
    Given rule USG-002 preconditions are satisfied
    When the actor executes get user
    Then system behavior matches the rule statement

  @USG-003
  Scenario: Successful get user returns user details payload.
    Given rule USG-003 preconditions are satisfied
    When the actor executes get user
    Then system behavior matches the rule statement
