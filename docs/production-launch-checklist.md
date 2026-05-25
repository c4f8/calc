# Production Launch Checklist

Date: 2026-05-25

## Required Environment Variables

- `DATABASE_URL`: pooled/runtime PostgreSQL connection string when available.
- `POSTGRES_URL_NON_POOLING`: direct/non-pooling PostgreSQL connection string for migrations.
- `WEBAUTHN_ORIGIN`: exact HTTPS origin, for example `https://arch.vercel.app`.
- `WEBAUTHN_RP_ID`: hostname only, for example `arch.vercel.app`.
- `WEBAUTHN_RP_NAME`: `ARCHIPELAG Admin`.
- `ADMIN_EMAIL`: production bootstrap admin email.
- `ADMIN_NAME`: production bootstrap admin display name.
- `ADMIN_PASSWORD`: unique launch password, not `archipelag`, at least 14 characters.
- `AUDIT_IP_HASH_SECRET`: random launch secret used to HMAC hash audit IP values.

## Pre-Launch Checks

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build` with production database env vars.
- Confirm Prisma migrations apply successfully.
- Confirm seed fails in production-like environments if `ADMIN_PASSWORD` is missing or set to a known placeholder.

## Browser Smoke Checks

- Open the deployed HTTPS origin.
- Confirm public calculator loads current catalog/settings.
- Log in at `/admin/login` with bootstrap credentials.
- Register a passkey from `/admin/settings`.
- Log out.
- Log in with passkey.
- Save Settings.
- Save Catalog.
- Confirm public calculator reflects saved changes.
- Generate PNG export.

## Security Smoke Checks

- Send browser/same-origin unauthenticated admin mutation; expect `401`.
- Send cross-origin or mismatched `Origin` admin mutation; expect `403`.
- Repeat invalid password attempts more than five times in fifteen minutes; expect throttled login failure and an audit row with `login.failure` / `reason: rate_limited`.
- Inspect database audit rows for `login.success`, `passkey.registration`, `settings.save`, and `catalog.save`.

## Post-Launch Operation

- Store bootstrap password in the client's password manager.
- Prefer passkey login for daily admin use.
- Rotate the bootstrap password after launch handoff.
- Keep `WEBAUTHN_ORIGIN` and `WEBAUTHN_RP_ID` aligned with the final production domain.
