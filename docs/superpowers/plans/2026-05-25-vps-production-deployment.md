# VPS Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch the app at `https://info.aglab.pro` on the Ubuntu 24 VPS `195.161.68.76` with local PostgreSQL and Hostia/NSKA DNS.

**Architecture:** The VPS runs PostgreSQL locally, the Next.js app on localhost port `3000`, and Caddy as the public HTTPS reverse proxy. Hostia/NSKA remains the DNS provider and only points `info.aglab.pro` to the VPS IP.

**Tech Stack:** Ubuntu 24, Node.js LTS, npm, Prisma, PostgreSQL, systemd, Caddy, UFW, Hostia/NSKA DNS.

---

## Files and Server Artifacts

- Create on VPS: `/opt/calc`
- Create on VPS: `/opt/calc/.env`
- Create on VPS: `/etc/systemd/system/calc.service`
- Create or modify on VPS: `/etc/caddy/Caddyfile`
- Create in PostgreSQL: database `calc_prod`
- Create in PostgreSQL: user `calc_app`
- Modify in Hostia/NSKA DNS panel: `info.aglab.pro` `A` record

No repository source files are expected to change during deployment.

## Task 1: Establish SSH Access and Baseline Server State

**Files:**
- Create on VPS: none
- Modify on VPS: none

- [ ] **Step 1: Connect as root**

Run locally:

```bash
ssh root@195.161.68.76
```

Expected: shell prompt on Ubuntu 24 VPS.

- [ ] **Step 2: Confirm OS and architecture**

Run on VPS:

```bash
cat /etc/os-release
uname -m
```

Expected: Ubuntu 24.x and `x86_64` or compatible Linux architecture.

- [ ] **Step 3: Update package metadata**

Run on VPS:

```bash
apt-get update
```

Expected: package lists refresh without fatal errors.

## Task 2: Install Runtime Packages

**Files:**
- Create on VPS: none
- Modify on VPS: system packages

- [ ] **Step 1: Install base packages**

Run on VPS:

```bash
apt-get install -y curl ca-certificates gnupg git build-essential openssl ufw
```

Expected: packages install successfully.

- [ ] **Step 2: Install Node.js LTS**

Run on VPS:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v
npm -v
```

Expected: Node.js `v22.x` and npm are available.

- [ ] **Step 3: Install PostgreSQL**

Run on VPS:

```bash
apt-get install -y postgresql postgresql-contrib
systemctl enable --now postgresql
systemctl status postgresql --no-pager
```

Expected: PostgreSQL service is active.

- [ ] **Step 4: Install Caddy**

Run on VPS:

```bash
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy
systemctl enable --now caddy
```

Expected: Caddy service is installed and active.

## Task 3: Create Deploy User and Firewall

**Files:**
- Create on VPS: deploy user home
- Modify on VPS: UFW state

- [ ] **Step 1: Create deploy user**

Run on VPS:

```bash
id deploy || adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chown -R deploy:deploy /home/deploy/.ssh
```

Expected: `deploy` user exists.

- [ ] **Step 2: Configure firewall**

Run on VPS:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose
```

Expected: UFW allows SSH, HTTP, and HTTPS.

## Task 4: Create Production Database

**Files:**
- Create in PostgreSQL: `calc_prod`
- Create in PostgreSQL: `calc_app`

- [ ] **Step 1: Generate a database password**

Run on VPS:

```bash
openssl rand -base64 32
```

Expected: one random password. Save it only into the VPS env file in Task 6.

- [ ] **Step 2: Create PostgreSQL user and database**

Run on VPS, replacing `PASTE_DB_PASSWORD` with the generated password:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER calc_app WITH PASSWORD 'PASTE_DB_PASSWORD';
CREATE DATABASE calc_prod OWNER calc_app;
GRANT ALL PRIVILEGES ON DATABASE calc_prod TO calc_app;
SQL
```

Expected: `CREATE ROLE`, `CREATE DATABASE`, and `GRANT`.

## Task 5: Upload Application Source

**Files:**
- Create on VPS: `/opt/calc`

- [ ] **Step 1: Create app directory**

Run on VPS:

```bash
mkdir -p /opt/calc
chown deploy:deploy /opt/calc
```

Expected: `/opt/calc` exists and is owned by `deploy`.

- [ ] **Step 2: Upload project from local machine**

Run locally from `/home/ronin/Desktop/project/calc`:

```bash
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  ./ root@195.161.68.76:/opt/calc/
```

Expected: project files are copied to `/opt/calc`.

- [ ] **Step 3: Fix ownership after upload**

Run on VPS:

```bash
chown -R deploy:deploy /opt/calc
```

Expected: `/opt/calc` files are owned by `deploy`.

## Task 6: Configure Production Environment

**Files:**
- Create on VPS: `/opt/calc/.env`

- [ ] **Step 1: Generate application secrets**

Run on VPS:

```bash
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

Expected: random values for database, admin launch password, and audit hashing secret.

- [ ] **Step 2: Write env file**

Run on VPS, replacing placeholders with generated values and intended admin bootstrap values:

```bash
cat > /opt/calc/.env <<'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://calc_app:PASTE_DB_PASSWORD@localhost:5432/calc_prod
POSTGRES_URL_NON_POOLING=postgresql://calc_app:PASTE_DB_PASSWORD@localhost:5432/calc_prod
WEBAUTHN_ORIGIN=https://info.aglab.pro
WEBAUTHN_RP_ID=info.aglab.pro
WEBAUTHN_RP_NAME=ARCHIPELAG Admin
ADMIN_EMAIL=PASTE_ADMIN_EMAIL
ADMIN_NAME=ARCHIPELAG Admin
ADMIN_PASSWORD=PASTE_ADMIN_PASSWORD
AUDIT_IP_HASH_SECRET=PASTE_RANDOM_AUDIT_SECRET
EOF
chown deploy:deploy /opt/calc/.env
chmod 600 /opt/calc/.env
```

Expected: env file exists, is owned by `deploy`, and is not world-readable.

## Task 7: Install Dependencies, Migrate, Seed, and Build

**Files:**
- Modify on VPS: `/opt/calc/node_modules`
- Modify in PostgreSQL: application schema and seed data
- Create on VPS: `/opt/calc/.next`

- [ ] **Step 1: Install dependencies**

Run on VPS:

```bash
cd /opt/calc
sudo -u deploy npm install
```

Expected: dependencies install without fatal errors.

- [ ] **Step 2: Generate Prisma client**

Run on VPS:

```bash
cd /opt/calc
sudo -u deploy npx prisma generate
```

Expected: Prisma client generation succeeds.

- [ ] **Step 3: Deploy database migrations**

Run on VPS:

```bash
cd /opt/calc
sudo -u deploy npx prisma migrate deploy
```

Expected: migrations apply to `calc_prod`.

- [ ] **Step 4: Seed database**

Run on VPS:

```bash
cd /opt/calc
sudo -u deploy npx tsx prisma/seed.ts
```

Expected: admin/bootstrap seed succeeds without duplicating unsafe data.

- [ ] **Step 5: Build app**

Run on VPS:

```bash
cd /opt/calc
sudo -u deploy npm run build
```

Expected: Next.js production build succeeds.

## Task 8: Configure systemd App Service

**Files:**
- Create on VPS: `/etc/systemd/system/calc.service`

- [ ] **Step 1: Write service file**

Run on VPS:

```bash
cat > /etc/systemd/system/calc.service <<'EOF'
[Unit]
Description=Calc Next.js production app
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/calc
EnvironmentFile=/opt/calc/.env
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

Expected: service file is created.

- [ ] **Step 2: Start app service**

Run on VPS:

```bash
systemctl daemon-reload
systemctl enable --now calc
systemctl status calc --no-pager
```

Expected: `calc` service is active.

## Task 9: Configure Caddy and DNS

**Files:**
- Modify on VPS: `/etc/caddy/Caddyfile`
- Modify in Hostia/NSKA DNS panel: `info.aglab.pro` `A` record

- [ ] **Step 1: Write Caddy config**

Run on VPS:

```bash
cat > /etc/caddy/Caddyfile <<'EOF'
info.aglab.pro {
	reverse_proxy 127.0.0.1:3000
	encode zstd gzip
}
EOF
caddy fmt --overwrite /etc/caddy/Caddyfile
systemctl reload caddy
```

Expected: Caddy reloads without config errors.

- [ ] **Step 2: Change DNS in Hostia/NSKA panel**

In the Hostia/NSKA DNS panel, update:

```text
Record: info.aglab.pro
Type: A
Value: 195.161.68.76
```

Expected: `info.aglab.pro` stops pointing to `90.156.170.50` and points to `195.161.68.76`.

## Task 10: Launch Verification and Post-Launch Security

**Files:**
- Modify external state: root VPS password after launch

- [ ] **Step 1: Confirm DNS**

Run locally:

```bash
dig +short A info.aglab.pro
```

Expected: `195.161.68.76`.

- [ ] **Step 2: Confirm HTTPS**

Run locally:

```bash
curl -I https://info.aglab.pro
```

Expected: HTTP `200`, `301`, `302`, or app-specific response over HTTPS with a valid certificate.

- [ ] **Step 3: Confirm app service logs**

Run on VPS:

```bash
journalctl -u calc -n 100 --no-pager
```

Expected: no repeated crash loop or missing environment errors.

- [ ] **Step 4: Rotate root password**

Run on VPS:

```bash
passwd root
```

Expected: root password is changed because the original password was shared in chat.

- [ ] **Step 5: Record launch state**

Record:

```text
Domain: info.aglab.pro
VPS IP: 195.161.68.76
App directory: /opt/calc
Service: calc
Database: calc_prod
Reverse proxy: Caddy
```

Expected: operator has the minimum production runbook facts.

## Self-Review

- Spec coverage: the plan covers SSH access, packages, PostgreSQL, app upload, env, migrations, build, systemd, Caddy, DNS, verification, and password rotation.
- Placeholder scan: placeholders remain only where runtime secrets must be supplied interactively and must not be written into repository files.
- Scope check: the plan does not include PHP/MySQL rewrite, Docker, managed database migration, or CI/CD automation.
- Consistency check: the domain, VPS IP, app port, database name, and service name are consistent across tasks.
