# Login

## Intent
Allow an existing user to authenticate securely and access the application.

## Happy Path
- User provides a registered email and correct password.
- System authenticates the user.
- System returns a valid session token.

## Expected Behavior
- Authentication fails safely for unknown or invalid credentials.
- Successful login always produces an active session token.
- Locked accounts remain blocked even when credentials are correct.

## Rules
- LGN-001: Login requires registered email.
- LGN-002: Login requires correct password for the registered email.
- LGN-003: Successful login returns an active session token.

## Edge Cases
- Unknown email: return invalid credentials error.
- Wrong password: return invalid credentials error.
- Locked account: block login and show account status message.

## Non-Goals
- Multi-factor authentication behavior.

<!-- AGENT-LAST-UPDATE:START -->
## Agent Update Note (Simulated)
- timestamp: 2026-05-31T06:32:14.074Z
- source: mock-pr-diff.txt
- impact: login
- keyword "auth" matched: M src/auth/registration-service.ts
- keyword "login" matched: M src/auth/login-service.ts
<!-- AGENT-LAST-UPDATE:END -->
