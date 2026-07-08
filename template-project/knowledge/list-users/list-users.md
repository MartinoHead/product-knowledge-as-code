# List Users

## Intent
Allow authorized clients to retrieve a complete list of all managed users in the system.

## Happy Path
- Authorized request is submitted without parameters.
- System returns a list of all managed users with their details.

## Expected Behavior
- Authorization is mandatory for all user list operations.
- Unauthenticated requests return unauthorized response.
- Valid tokens return the complete list of managed users.
- Users are returned in creation order (oldest first).
- Each user in the list includes userId, email, firstName, and lastName.

## Rules
- LISTUSR-001: List users requires authorization.
- LISTUSR-002: List users returns empty array when no users exist.
- LISTUSR-003: List users returns all created managed users.
- LISTUSR-004: List users includes userId, email, firstName, and lastName fields.
- LISTUSR-005: List users returns users in creation order.
- LISTUSR-006: Invalid token returns unauthorized response.

## Edge Cases
- Missing authorization header: return unauthorized response (401).
- Invalid or expired token: return unauthorized response (401).
- No managed users created: return empty users array.
- Multiple managed users: return all in creation order.
- Cross-user visibility: all authenticated users see the same shared list.

## Non-Goals
- Pagination or filtering by email/name.
- Bulk operations or batch updates.
- Role-based access control (all authenticated users see all users).
- User search or sorting by custom criteria.

## Database Considerations
- Query should support both PostgreSQL (via Prisma) and in-memory fallback.
- ORDER BY createdAt ASC to maintain creation order.
- No soft-deletes; deleted users should not appear in list.

## API Contract
**Endpoint:** `GET /v1/users`

**Request:**
```
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "users": [
    {
      "userId": "usr_1",
      "email": "user1@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    {
      "userId": "usr_2",
      "email": "user2@example.com",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  ]
}
```

**Unauthorized Response (401):**
```json
{
  "error": "missing_auth",
  "message": "Authorization header is required."
}
```

**Invalid Token Response (401):**
```json
{
  "error": "invalid_token",
  "message": "Token is invalid or expired."
}
```
