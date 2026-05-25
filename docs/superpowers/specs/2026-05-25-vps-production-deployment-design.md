# VPS Production Deployment Design

Date: 2026-05-25

## Goal

Launch the application at `https://info.aglab.pro` within the current production window.

The external Ubuntu 24 VPS at `195.161.68.76` will host both the Next.js application and PostgreSQL. Hostia/NSKA will remain responsible only for DNS management for `aglab.pro`.

## Selected Approach

Use a native Ubuntu deployment:

- PostgreSQL installed directly on the VPS.
- Node.js LTS installed directly on the VPS.
- The Next.js app built and run as a systemd service.
- Caddy installed as the public reverse proxy and HTTPS terminator.
- UFW firewall allowing only SSH, HTTP, and HTTPS.

This is preferred over Docker for this launch because it has fewer moving parts, faster debugging, and simpler service inspection on a fresh VPS.

## DNS

The current nameservers for `aglab.pro` are `ns9.nska.net` and `ns10.nska.net`.

The `info.aglab.pro` DNS record must be changed in the Hostia/NSKA DNS panel:

- Type: `A`
- Name/host: `info`
- Value: `195.161.68.76`
- Remove or replace the current value `90.156.170.50`

SSL must be issued on the VPS after DNS points to the VPS. Hostia SSL does not secure an external VPS application.

## VPS Runtime Architecture

The VPS will run:

- Caddy listening on ports `80` and `443`.
- Next.js app listening on local port `3000`.
- PostgreSQL listening locally only.
- systemd service managing the app process.

Public traffic flow:

`browser -> https://info.aglab.pro -> Caddy -> localhost:3000 -> Next.js -> local PostgreSQL`

## Server Security

Initial setup may use root SSH because this is a new VPS.

Production hardening must include:

- Create a non-root deploy user.
- Restrict firewall to `22`, `80`, and `443`.
- Keep PostgreSQL bound to localhost.
- Store production secrets only in a server-side env file.
- Do not commit `.env` or credentials.
- Rotate the VPS root password after setup because it was shared in chat.

SSH key-based login can be added after launch. It is not required for the first production push if time is limited, but password rotation remains required.

## Application Configuration

Production environment must include:

- `DATABASE_URL`
- `POSTGRES_URL_NON_POOLING`
- `WEBAUTHN_ORIGIN=https://info.aglab.pro`
- `WEBAUTHN_RP_ID=info.aglab.pro`
- Admin bootstrap credentials/secrets
- `AUDIT_IP_HASH_SECRET`
- Any existing app-specific secrets required by the project

The production database provider is PostgreSQL, matching the Prisma schema.

## Deployment Flow

1. Connect to the VPS over SSH.
2. Install OS packages, Node.js LTS, PostgreSQL, Caddy, and build tools.
3. Create PostgreSQL database and user for the app.
4. Create a deploy user and app directory.
5. Upload or clone the project.
6. Install dependencies.
7. Write production env file on the VPS.
8. Run Prisma generation, migrations, and seed.
9. Build the Next.js app.
10. Create and enable a systemd app service.
11. Configure Caddy for `info.aglab.pro`.
12. Change DNS `A` record in Hostia/NSKA.
13. Let Caddy issue HTTPS once DNS resolves.

## Verification

Before calling launch complete, verify:

- `info.aglab.pro` resolves to `195.161.68.76`.
- HTTPS certificate is valid.
- Public pages load.
- Admin login works.
- Admin passkey flow still uses `info.aglab.pro`.
- At least one admin mutation succeeds and is audited.
- Service restarts survive `systemctl restart`.
- Logs show no repeated runtime errors.

## Rollback

If the VPS deployment fails before DNS cutover, leave DNS unchanged.

If it fails after DNS cutover:

- Point `info.aglab.pro` back to the previous record if a working fallback exists.
- Or temporarily serve a maintenance page from Caddy while the app service is fixed.

The database should not be reset during rollback unless explicitly approved.

## Out of Scope

- Rewriting the app for PHP/MySQL shared hosting.
- Using Hostia FTP as the production runtime.
- Moving database to a managed provider during this launch window.
- Full CI/CD automation.
