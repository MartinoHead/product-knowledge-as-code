# Registration

## Intent
Allow a new user to create an account securely.

## Happy Path
- User submits a unique email and valid password.
- System creates account.
- System sends verification email.

## Expected Behavior
- Registration is rejected for invalid email formats and weak passwords.
- Duplicate emails are blocked with a user-friendly error.
- Successful registration always triggers a verification email.

## Rules
- REG-001: Email must be valid format.
- REG-002: Email must be unique.
- REG-003: Password length must be at least 10 characters.
- REG-004: Verification email is sent after successful registration.

## Edge Cases
- Existing email: show user-friendly duplicate error.
- Invalid email format: block submission.
- Weak password: show validation message.

## Non-Goals
- Social login behavior.

<!-- AGENT-LAST-UPDATE:START -->
## Agent Update Note (Simulated)
- timestamp: 2026-05-31T06:32:14.074Z
- source: mock-pr-diff.txt
- impact: registration
- keyword "registration" matched: M src/auth/registration-service.ts
<!-- AGENT-LAST-UPDATE:END -->

<!-- PR-IMPACT:START -->
## PR Impact Update (Prototype)
- updatedAt: 2026-05-31T06:38:10.348Z
- Password rule updated in REG-003: minimum length 8 -> 10.
- Email validation behavior marked as impacted (REG-001/REG-002).
<!-- PR-IMPACT:END -->

<!-- CLOSED-LOOP:START -->
## Closed Loop Trace
- updatedAt: 2026-05-31T06:42:20.480Z
- domain: registration
- reason: Password policy changed to min 10 characters
<!-- CLOSED-LOOP:END -->
