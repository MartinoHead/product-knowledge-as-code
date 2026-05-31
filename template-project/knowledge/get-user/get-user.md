# Get User

## Intent
Allow authorized clients to retrieve user details by identifier.

## Happy Path
- Authorized request provides an existing user identifier.
- System returns user details for that identifier.

## Expected Behavior
- Authorization is mandatory for all user read operations.
- Existing identifiers return a complete user payload.
- Invalid or unknown identifiers return explicit error outcomes.

## Rules
- USG-001: Get user requires authorization.
- USG-002: Get user requires existing user identifier.
- USG-003: Successful get user returns user details payload.

## Edge Cases
- Missing authorization: return unauthorized response.
- Unknown user identifier: return not found response.
- Malformed identifier: return validation error.

## Non-Goals
- Bulk user listing and pagination behavior.
