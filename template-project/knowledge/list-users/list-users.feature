Feature: List Users
  Product behavior for listing all managed users in the system.

  @LISTUSR-001
  Scenario: List users requires authorization.
    Given a request without authorization token
    When list users is submitted
    Then unauthorized response is returned
    And error code is "missing_auth"

  @LISTUSR-002
  Scenario: List users returns empty array when no users exist.
    Given an authenticated user
    And no managed users have been created
    When list users is submitted
    Then response status is 200 OK
    And response includes empty users array

  @LISTUSR-003
  Scenario: List users returns all created managed users.
    Given an authenticated user
    And multiple managed users have been created
    When list users is submitted
    Then response includes all created managed users
    And no managed users are hidden or filtered

  @LISTUSR-004
  Scenario: List users includes userId, email, firstName, and lastName fields.
    Given an authenticated user
    And managed users exist in the system
    When list users is submitted
    Then each user includes userId field
    And each user includes email field
    And each user includes firstName field
    And each user includes lastName field
    And no additional fields are returned

  @LISTUSR-005
  Scenario: List users returns users in creation order.
    Given an authenticated user
    And multiple managed users were created sequentially
    When list users is submitted
    Then users are returned in ascending creation order
    And first user was created before second user
    And order is consistent across requests

  @LISTUSR-006
  Scenario: Invalid token returns unauthorized response.
    Given a request with an invalid token
    When list users is submitted
    Then unauthorized response is returned
    And error code is "invalid_token"
