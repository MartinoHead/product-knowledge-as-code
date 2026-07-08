Feature: Login
  Product behavior for login.

  @LGN-001
  Scenario: Login requires registered email.
    Given rule LGN-001 preconditions are satisfied
    When the actor executes login
    Then system behavior matches the rule statement

  @LGN-002
  Scenario: Login requires correct password for the registered email.
    Given rule LGN-002 preconditions are satisfied
    When the actor executes login
    Then system behavior matches the rule statement

  @LGN-003
  Scenario: Successful login returns an active session token.
    Given rule LGN-003 preconditions are satisfied
    When the actor executes login
    Then system behavior matches the rule statement
