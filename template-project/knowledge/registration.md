# Registration

## Intent
Allow a new user to create an account securely.

## Happy Path
- User submits a unique email and valid password.
- System creates account.
- System sends verification email.

## Rules
- REG-001: Email must be valid format.
- REG-002: Email must be unique.
- REG-003: Password length must be at least 8 characters.
- REG-004: Verification email is sent after successful registration.

## Edge Cases
- Existing email: show user-friendly duplicate error.
- Invalid email format: block submission.
- Weak password: show validation message.

## Non-Goals
- Social login behavior.
