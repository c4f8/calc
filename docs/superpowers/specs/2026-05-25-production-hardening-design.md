# Production Hardening Design

Date: 2026-05-25
Status: Approved for implementation planning

## Goal

Harden the approved ARCHIPELAG calculator for a near-term production launch without changing the client-approved customer-facing design. The work focuses on reducing admin and deployment risk in the next few hours.

## Scope

In scope:

- Production-safe admin bootstrap credentials.
- Shared server-side protection for admin mutations.
- CSRF or same-origin protection for cookie-authenticated admin writes.
- Shorter production admin session lifetime.
- Basic throttling around password login and passkey challenge generation.
- Minimal append-only audit trail for admin-sensitive events.
- Deployment checklist for required environment variables and launch smoke checks.

Out of scope for this launch sprint:

- Full role-based access control.
- Admin user management UI.
- Password reset flow.
- Audit log UI.
- Broader customer-facing redesign.
- Monitoring dashboard or alerting integration.

## Current Risks

The current prototype already has server-side admin page/API checks, HttpOnly session cookies, Prisma-backed persistence, password verification, and SimpleWebAuthn passkeys. The launch risks are concentrated in production hardening:

- The seed creates `admin@archipelag.design` with password `archipelag`, which is unsafe if deployed unchanged.
- Admin catalog/settings mutations accept cookie-authenticated requests without a dedicated CSRF token or explicit same-origin guard.
- Password login and passkey challenge endpoints have no throttling.
- Production admin sessions last 30 days.
- Admin writes leave no append-only audit trail.
- Launch depends on exact WebAuthn and database environment variables.

## Design

### Auth and Bootstrap

The production seed flow must stop relying on hardcoded bootstrap credentials. The seed should read bootstrap values from environment variables such as `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD`.

In production, seeding should fail fast if required bootstrap variables are absent or if the password equals the known prototype password `archipelag`. In development, safe defaults can remain available for local convenience.

Passkeys remain the preferred ongoing admin authentication path. Password login remains a reserve/bootstrap path, not the primary daily workflow.

### Admin Mutation Guard

All admin mutation route handlers should use one shared server-side guard. The guard should:

- Verify a valid admin session.
- Reject requests whose `Origin` does not match the request host or configured production origin.
- Return consistent JSON errors for unauthorized or forbidden requests.

This guard should be applied to catalog save, settings save, passkey registration, and future admin mutation endpoints. Page-level protection and client UI visibility are not considered sufficient security boundaries.

If implementation time allows, client admin saves can also include a lightweight CSRF token. For the launch sprint, an explicit same-origin guard is the minimum required hardening because it directly protects cookie-authenticated writes.

### Session Policy

Production admin session lifetime should be reduced from 30 days to approximately 12 hours. Development can keep a longer lifetime if needed.

The session cookie should remain HttpOnly and Secure in production. SameSite should be as strict as practical; `strict` is preferred for admin cookies if passkey and navigation flows continue to work, otherwise `lax` is acceptable with the same-origin mutation guard.

### Throttling

Add minimal server-side throttling for high-risk auth endpoints:

- Password login attempts.
- Passkey login options generation.
- Passkey verification attempts.
- Passkey registration options generation for authenticated admins.

The first implementation can be database-backed with short windows and simple keys. Acceptable keys are email plus a best-effort request IP signal for password login, and request IP or session user ID for passkey flows.

This is intended to reduce obvious abuse before launch, not to replace a production-grade WAF or provider-level rate limit.

### Audit Trail

Add an append-only admin audit model for security-relevant events:

- Login success.
- Login failure.
- Logout.
- Catalog save.
- Settings save.
- Passkey registration.

Each event should record timestamp, event type, optional admin user ID, optional actor email, request metadata when safe, and compact JSON metadata. Do not store passwords, raw session tokens, passkey challenge values, or full credential public keys in audit rows.

No audit UI is required for this launch sprint. Database inspection is sufficient for immediate operational visibility.

### Deployment Hygiene

Production deployment must require:

- `DATABASE_URL`
- `POSTGRES_URL_NON_POOLING`
- `WEBAUTHN_ORIGIN`
- `WEBAUTHN_RP_ID`
- `WEBAUTHN_RP_NAME`
- `ADMIN_EMAIL`
- `ADMIN_NAME`
- `ADMIN_PASSWORD`

`WEBAUTHN_ORIGIN` must be the exact HTTPS origin. `WEBAUTHN_RP_ID` must be only the hostname.

Before client launch, the operator should:

- Deploy with production env vars.
- Log in with bootstrap password.
- Register a passkey.
- Save Settings.
- Save Catalog.
- Verify the public calculator loads current data.
- Verify PNG export.
- Rotate or remove the bootstrap password path if the final operating model allows it.

## Implementation Units

The implementation should be split into small, isolated units:

- `auth` hardening: session lifetime, shared mutation guard, origin checks.
- `seed` hardening: env-driven bootstrap admin and production fail-fast behavior.
- `audit` persistence: Prisma model, migration, logging helper, event calls.
- `rateLimit` helper: small reusable database-backed limiter and endpoint integration.
- `deploy` documentation: env variable and smoke-test checklist.

Each unit should preserve existing project patterns and avoid customer-facing UI changes.

## Data Flow

Admin page requests continue to call `requireAdmin()`.

Admin client components continue to submit catalog/settings changes through existing API routes.

Admin API routes call the shared mutation guard before parsing request JSON or mutating database state.

Auth-related endpoints apply throttling before expensive verification work where practical, then write audit events for success and failure outcomes.

Seed logic creates or updates the bootstrap admin only when configuration is explicitly safe for the current environment.

## Error Handling

Unauthorized requests return `401`.

Authenticated requests failing same-origin or CSRF checks return `403`.

Validation failures continue to return `400` with existing structured validation details.

Throttled auth attempts return `429`.

Production seed misconfiguration fails fast with a clear error message so an unsafe deployment does not proceed silently.

## Testing and Verification

Narrow launch checks should cover:

- Typecheck or lint after code changes.
- Prisma migration generation/application path.
- Password login with env-configured bootstrap admin.
- Passkey registration and login on the configured HTTPS origin.
- Unauthorized admin API requests fail.
- Cross-origin admin mutation attempts fail.
- Auth throttling triggers after repeated attempts.
- Catalog/settings save still work for a valid admin.
- Public calculator and PNG export still work.

If external production access or secrets are unavailable in the development environment, record that limitation and verify the deploy checklist manually after launch environment configuration.

