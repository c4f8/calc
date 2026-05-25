# Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the approved ARCHIPELAG calculator for a near-term production launch by reducing admin auth, CSRF, seed, audit, throttling, and deploy risks without changing the customer-facing design.

**Architecture:** Add small server-only security helpers around the existing Next.js App Router and Prisma stack. Reuse the current admin session model, wrap admin mutations with a shared guard, add minimal database-backed audit/rate-limit tables, and keep all changes isolated to admin/server paths.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, PostgreSQL, SimpleWebAuthn, Node crypto, Zod.

---

## Scope Check

This plan intentionally keeps the launch hardening work in one integrated plan because the affected pieces share the same admin security boundary: session cookies, admin routes, seed credentials, and deploy readiness. It does not add RBAC, admin user management UI, password reset, audit UI, external monitoring, or customer-facing redesign.

## File Structure

- Modify: `prisma/schema.prisma` - add append-only audit events and simple rate-limit buckets.
- Create: `prisma/migrations/20260525000000_production_hardening/migration.sql` - production database migration for the two new tables.
- Create: `src/lib/admin-security.ts` - pure helper functions for origin checks, session duration, IP extraction, and stable rate-limit keys.
- Create: `src/lib/admin-security.test.ts` - Node tests for pure security helpers.
- Create: `src/lib/admin-mutation-guard.ts` - shared guard for cookie-authenticated admin mutation route handlers.
- Create: `src/lib/audit.ts` - append-only audit event writer.
- Create: `src/lib/rate-limit.ts` - minimal Prisma-backed fixed-window throttling helper.
- Modify: `src/lib/auth.ts` - reduce production session lifetime and keep existing session lookup API.
- Modify: `prisma/seed.ts` - replace production hardcoded bootstrap password with env-driven safe credentials.
- Modify: `.env.example` - document required production admin bootstrap variables.
- Modify: `src/app/admin/login/actions.ts` - throttle password login and write audit events.
- Modify: `src/app/api/admin/catalog/route.ts` - use shared mutation guard and audit successful saves.
- Modify: `src/app/api/admin/settings/route.ts` - use shared mutation guard and audit successful saves.
- Modify: `src/app/api/admin/passkeys/register/options/route.ts` - use shared mutation guard and throttle passkey registration challenge generation.
- Modify: `src/app/api/admin/passkeys/register/verify/route.ts` - use shared mutation guard and audit successful passkey registration.
- Modify: `src/app/api/admin/passkeys/login/options/route.ts` - apply same-origin check and throttle unauthenticated passkey challenge generation.
- Modify: `src/app/api/admin/passkeys/login/verify/route.ts` - apply same-origin check, throttle verification attempts, and audit successful passkey login.
- Create: `docs/production-launch-checklist.md` - exact launch env and smoke checklist.

---

### Task 1: Pure Security Helpers

**Files:**
- Create: `src/lib/admin-security.ts`
- Create: `src/lib/admin-security.test.ts`

- [ ] **Step 1: Write failing tests for origin, session, and key helpers**

Create `src/lib/admin-security.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getClientIp,
  getExpectedOrigin,
  getSessionDurationDays,
  hashRateLimitKey,
  isSameOriginRequest,
} from './admin-security'

function headers(values: Record<string, string>): Headers {
  return new Headers(values)
}

test('production sessions last twelve hours', () => {
  assert.equal(getSessionDurationDays('production'), 0.5)
})

test('development sessions keep thirty day convenience lifetime', () => {
  assert.equal(getSessionDurationDays('development'), 30)
})

test('expected origin prefers configured origin', () => {
  assert.equal(
    getExpectedOrigin(headers({ host: 'wrong.example.com' }), 'https://arch.example.com'),
    'https://arch.example.com',
  )
})

test('expected origin falls back to forwarded host and proto', () => {
  assert.equal(
    getExpectedOrigin(headers({ 'x-forwarded-host': 'arch.example.com', 'x-forwarded-proto': 'https' }), undefined),
    'https://arch.example.com',
  )
})

test('same-origin request passes when origin matches configured production origin', () => {
  assert.equal(
    isSameOriginRequest(
      headers({ origin: 'https://arch.example.com', host: 'arch.example.com' }),
      'https://arch.example.com',
      true,
    ),
    true,
  )
})

test('cross-origin request fails when origin differs', () => {
  assert.equal(
    isSameOriginRequest(
      headers({ origin: 'https://evil.example.com', host: 'arch.example.com' }),
      'https://arch.example.com',
      true,
    ),
    false,
  )
})

test('production request without origin requires same-origin fetch metadata', () => {
  assert.equal(
    isSameOriginRequest(headers({ host: 'arch.example.com', 'sec-fetch-site': 'same-origin' }), undefined, true),
    true,
  )
  assert.equal(
    isSameOriginRequest(headers({ host: 'arch.example.com', 'sec-fetch-site': 'cross-site' }), undefined, true),
    false,
  )
})

test('client IP prefers first forwarded value', () => {
  assert.equal(getClientIp(headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })), '203.0.113.5')
})

test('rate limit keys are stable and scoped without exposing raw identifier', () => {
  const first = hashRateLimitKey('login', 'admin@example.com', '203.0.113.5')
  const second = hashRateLimitKey('login', 'admin@example.com', '203.0.113.5')
  assert.equal(first, second)
  assert.match(first, /^login:[a-f0-9]{64}$/)
  assert.equal(first.includes('admin@example.com'), false)
})
```

- [ ] **Step 2: Run tests and verify they fail because helper does not exist**

Run:

```bash
./node_modules/.bin/tsx --test src/lib/admin-security.test.ts
```

Expected: FAIL with a module resolution error for `./admin-security`.

- [ ] **Step 3: Implement pure security helpers**

Create `src/lib/admin-security.ts`:

```ts
import { createHash } from 'node:crypto'

export function getSessionDurationDays(nodeEnv = process.env.NODE_ENV): number {
  return nodeEnv === 'production' ? 0.5 : 30
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  return headers.get('x-real-ip')?.trim() || 'unknown'
}

export function getExpectedOrigin(headers: Headers, configuredOrigin = process.env.WEBAUTHN_ORIGIN): string | null {
  if (configuredOrigin) return normalizeOrigin(configuredOrigin)

  const host = firstHeaderValue(headers.get('x-forwarded-host')) || firstHeaderValue(headers.get('host'))
  if (!host) return null

  const proto = firstHeaderValue(headers.get('x-forwarded-proto')) || 'https'
  return normalizeOrigin(`${proto}://${host}`)
}

export function isSameOriginRequest(
  headers: Headers,
  configuredOrigin = process.env.WEBAUTHN_ORIGIN,
  production = process.env.NODE_ENV === 'production',
): boolean {
  const expectedOrigin = getExpectedOrigin(headers, configuredOrigin)
  const requestOrigin = headers.get('origin')

  if (requestOrigin && expectedOrigin) {
    return normalizeOrigin(requestOrigin) === expectedOrigin
  }

  const fetchSite = headers.get('sec-fetch-site')
  if (fetchSite) return fetchSite === 'same-origin'

  return !production
}

export function hashRateLimitKey(scope: string, ...parts: Array<string | null | undefined>): string {
  const hash = createHash('sha256')
    .update(parts.map((part) => part || '').join(':'))
    .digest('hex')

  return `${scope}:${hash}`
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null
}

function normalizeOrigin(value: string): string {
  const url = new URL(value)
  return url.origin
}
```

- [ ] **Step 4: Run helper tests and verify they pass**

Run:

```bash
./node_modules/.bin/tsx --test src/lib/admin-security.test.ts
```

Expected: PASS for all helper tests.

- [ ] **Step 5: Commit helper tests and implementation**

Run:

```bash
git add src/lib/admin-security.ts src/lib/admin-security.test.ts
git commit -m "test: cover admin security helpers"
```

---

### Task 2: Audit and Rate-Limit Persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260525000000_production_hardening/migration.sql`
- Create: `src/lib/audit.ts`
- Create: `src/lib/rate-limit.ts`

- [ ] **Step 1: Add Prisma models**

Append these models to `prisma/schema.prisma`:

```prisma
model AdminAuditEvent {
  id         String   @id @default(cuid())
  type       String
  userId     String?
  actorEmail String?
  ipHash     String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([type, createdAt])
  @@index([userId, createdAt])
}

model AdminRateLimit {
  key       String   @id
  count     Int      @default(0)
  resetAt   DateTime
  updatedAt DateTime @updatedAt

  @@index([resetAt])
}
```

- [ ] **Step 2: Add SQL migration**

Create `prisma/migrations/20260525000000_production_hardening/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "AdminAuditEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "actorEmail" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "AdminAuditEvent_type_createdAt_idx" ON "AdminAuditEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditEvent_userId_createdAt_idx" ON "AdminAuditEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminRateLimit_resetAt_idx" ON "AdminRateLimit"("resetAt");
```

- [ ] **Step 3: Create audit helper**

Create `src/lib/audit.ts`:

```ts
import 'server-only'
import { createHash } from 'node:crypto'
import { getClientIp } from '@/lib/admin-security'
import { prisma } from '@/lib/prisma'

export type AdminAuditEventType =
  | 'login.success'
  | 'login.failure'
  | 'logout'
  | 'catalog.save'
  | 'settings.save'
  | 'passkey.registration'
  | 'passkey.login'

export async function writeAdminAuditEvent({
  type,
  userId,
  actorEmail,
  headers,
  metadata,
}: {
  type: AdminAuditEventType
  userId?: string | null
  actorEmail?: string | null
  headers?: Headers | null
  metadata?: Record<string, string | number | boolean | null>
}): Promise<void> {
  await prisma.adminAuditEvent.create({
    data: {
      type,
      userId: userId ?? null,
      actorEmail: actorEmail ?? null,
      ipHash: headers ? hashIp(getClientIp(headers)) : null,
      userAgent: headers?.get('user-agent')?.slice(0, 300) ?? null,
      metadata: metadata ?? undefined,
    },
  })
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}
```

- [ ] **Step 4: Create rate-limit helper**

Create `src/lib/rate-limit.ts`:

```ts
import 'server-only'
import { getClientIp, hashRateLimitKey } from '@/lib/admin-security'
import { prisma } from '@/lib/prisma'

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

export function makeRequestRateLimitKey(scope: string, headers: Headers, identifier = ''): string {
  return hashRateLimitKey(scope, identifier.toLowerCase(), getClientIp(headers))
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  await prisma.adminRateLimit.deleteMany({ where: { resetAt: { lte: now } } })

  const existing = await prisma.adminRateLimit.findUnique({ where: { key } })
  if (!existing) {
    await prisma.adminRateLimit.create({ data: { key, count: 1, resetAt } })
    return { allowed: true }
  }

  if (existing.resetAt <= now) {
    await prisma.adminRateLimit.update({ where: { key }, data: { count: 1, resetAt } })
    return { allowed: true }
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)),
    }
  }

  await prisma.adminRateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
  return { allowed: true }
}
```

- [ ] **Step 5: Regenerate Prisma client**

Run:

```bash
npm run db:generate
```

Expected: Prisma client generation completes without schema errors.

- [ ] **Step 6: Commit persistence changes**

Run:

```bash
git add prisma/schema.prisma prisma/migrations/20260525000000_production_hardening/migration.sql src/lib/audit.ts src/lib/rate-limit.ts
git commit -m "feat: add admin audit and throttling storage"
```

---

### Task 3: Session Policy and Shared Admin Mutation Guard

**Files:**
- Modify: `src/lib/auth.ts`
- Create: `src/lib/admin-mutation-guard.ts`

- [ ] **Step 1: Reduce production session lifetime**

Modify `src/lib/auth.ts`:

```ts
import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionDurationDays } from '@/lib/admin-security'
import { prisma } from '@/lib/prisma'

const SESSION_COOKIE = 'archipelag_session'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createAdminSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url')
  const sessionDays = getSessionDurationDays()
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000)

  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.adminSession.delete({ where: { id: session.id } })
    return null
  }

  return session
}

export async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return session.user
}

export async function isAdminRequest(): Promise<boolean> {
  return Boolean(await getAdminSession())
}
```

- [ ] **Step 2: Add shared admin mutation guard**

Create `src/lib/admin-mutation-guard.ts`:

```ts
import 'server-only'
import { NextResponse } from 'next/server'
import { isSameOriginRequest } from '@/lib/admin-security'
import { getAdminSession } from '@/lib/auth'

export type AdminMutationSession = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>

export type AdminMutationGuardResult =
  | { ok: true; session: AdminMutationSession }
  | { ok: false; response: NextResponse }

export async function requireAdminMutation(request: Request): Promise<AdminMutationGuardResult> {
  const session = await getAdminSession()
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const sameOrigin = isSameOriginRequest(request.headers)
  if (!sameOrigin) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { ok: true, session }
}

export function requireSameOriginRequest(request: Request): NextResponse | null {
  if (isSameOriginRequest(request.headers)) return null
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

- [ ] **Step 3: Run helper tests and typecheck**

Run:

```bash
./node_modules/.bin/tsx --test src/lib/admin-security.test.ts
npm run typecheck
```

Expected: helper tests pass and TypeScript reports no errors.

- [ ] **Step 4: Commit session and guard changes**

Run:

```bash
git add src/lib/auth.ts src/lib/admin-mutation-guard.ts
git commit -m "feat: harden admin session and mutation guard"
```

---

### Task 4: Production-Safe Bootstrap Seed

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `.env.example`

- [ ] **Step 1: Document production admin env vars**

Update `.env.example`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
POSTGRES_URL_NON_POOLING="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
WEBAUTHN_ORIGIN="https://your-vercel-project.vercel.app"
WEBAUTHN_RP_ID="your-vercel-project.vercel.app"
WEBAUTHN_RP_NAME="ARCHIPELAG Admin"
ADMIN_EMAIL="admin@archipelag.design"
ADMIN_NAME="ARCHIPELAG Admin"
ADMIN_PASSWORD="replace-with-a-unique-launch-password"
```

- [ ] **Step 2: Add bootstrap credential helper to seed**

In `prisma/seed.ts`, add this helper above `main()`:

```ts
function getBootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@archipelag.design'
  const name = process.env.ADMIN_NAME?.trim() || 'ARCHIPELAG Admin'
  const password = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'archipelag')

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_NAME || !process.env.ADMIN_PASSWORD) {
      throw new Error('Production seed requires ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD')
    }

    if (password === 'archipelag' || password.length < 14) {
      throw new Error('Production ADMIN_PASSWORD must be unique and at least 14 characters')
    }
  }

  return { email, name, password }
}
```

- [ ] **Step 3: Replace hardcoded admin seed block**

Replace the existing `prisma.adminUser.upsert` block with:

```ts
  const admin = getBootstrapAdmin()
  await prisma.adminUser.upsert({
    where: { email: admin.email },
    update: { name: admin.name },
    create: {
      email: admin.email,
      name: admin.name,
      passwordHash: hashPassword(admin.password),
    },
  })
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript reports no errors.

- [ ] **Step 5: Commit seed hardening**

Run:

```bash
git add prisma/seed.ts .env.example
git commit -m "fix: require safe production admin seed"
```

---

### Task 5: Protect Admin Catalog and Settings Mutations

**Files:**
- Modify: `src/app/api/admin/catalog/route.ts`
- Modify: `src/app/api/admin/settings/route.ts`

- [ ] **Step 1: Update catalog route imports and guard**

In `src/app/api/admin/catalog/route.ts`, replace `isAdminRequest` import with these imports:

```ts
import { requireAdminMutation } from '@/lib/admin-mutation-guard'
import { writeAdminAuditEvent } from '@/lib/audit'
```

At the start of `PUT`, replace the existing auth check with:

```ts
  const guard = await requireAdminMutation(request)
  if (!guard.ok) return guard.response
```

After the transaction and before `revalidatePath('/')`, add:

```ts
  await writeAdminAuditEvent({
    type: 'catalog.save',
    userId: guard.session.userId,
    actorEmail: guard.session.user.email,
    headers: request.headers,
    metadata: { goods: goods.length, archived: archivedIds.length },
  })
```

- [ ] **Step 2: Update settings route imports and guard**

In `src/app/api/admin/settings/route.ts`, replace `isAdminRequest` import with these imports:

```ts
import { requireAdminMutation } from '@/lib/admin-mutation-guard'
import { writeAdminAuditEvent } from '@/lib/audit'
```

At the start of `PUT`, replace the existing auth check with:

```ts
  const guard = await requireAdminMutation(request)
  if (!guard.ok) return guard.response
```

After the `prisma.settings.upsert` call and before `revalidatePath('/')`, add:

```ts
  await writeAdminAuditEvent({
    type: 'settings.save',
    userId: guard.session.userId,
    actorEmail: guard.session.user.email,
    headers: request.headers,
    metadata: {
      minArea: data.minArea,
      maxArea: data.maxArea,
      defaultArea: data.defaultArea,
    },
  })
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript reports no errors.

- [ ] **Step 4: Commit admin mutation protection**

Run:

```bash
git add src/app/api/admin/catalog/route.ts src/app/api/admin/settings/route.ts
git commit -m "fix: guard admin catalog and settings writes"
```

---

### Task 6: Throttle and Audit Password Login

**Files:**
- Modify: `src/app/admin/login/actions.ts`

- [ ] **Step 1: Add login throttling and audit imports**

In `src/app/admin/login/actions.ts`, add imports:

```ts
import { headers } from 'next/headers'
import { writeAdminAuditEvent } from '@/lib/audit'
import { consumeRateLimit, makeRequestRateLimitKey } from '@/lib/rate-limit'
```

- [ ] **Step 2: Harden `loginAction`**

Replace `loginAction` with:

```ts
export async function loginAction(formData: FormData) {
  const requestHeaders = await headers()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const rateLimit = await consumeRateLimit(makeRequestRateLimitKey('password-login', requestHeaders, email), 5, 15 * 60 * 1000)

  if (!rateLimit.allowed) {
    await writeAdminAuditEvent({
      type: 'login.failure',
      actorEmail: email || null,
      headers: requestHeaders,
      metadata: { reason: 'rate_limited', retryAfterSeconds: rateLimit.retryAfterSeconds },
    })
    redirect('/admin/login?error=1')
  }

  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    await writeAdminAuditEvent({
      type: 'login.failure',
      actorEmail: email || null,
      headers: requestHeaders,
      metadata: { reason: 'invalid_credentials' },
    })
    redirect('/admin/login?error=1')
  }

  await createAdminSession(user.id)
  await writeAdminAuditEvent({
    type: 'login.success',
    userId: user.id,
    actorEmail: user.email,
    headers: requestHeaders,
    metadata: { method: 'password' },
  })
  redirect('/admin/catalog')
}
```

- [ ] **Step 3: Harden `logoutAction` audit**

Replace `logoutAction` with:

```ts
export async function logoutAction() {
  const requestHeaders = await headers()
  await writeAdminAuditEvent({ type: 'logout', headers: requestHeaders })
  await destroyAdminSession()
  redirect('/admin/login')
}
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript reports no errors.

- [ ] **Step 5: Commit login hardening**

Run:

```bash
git add src/app/admin/login/actions.ts
git commit -m "fix: throttle and audit admin password login"
```

---

### Task 7: Harden Passkey Endpoints

**Files:**
- Modify: `src/app/api/admin/passkeys/register/options/route.ts`
- Modify: `src/app/api/admin/passkeys/register/verify/route.ts`
- Modify: `src/app/api/admin/passkeys/login/options/route.ts`
- Modify: `src/app/api/admin/passkeys/login/verify/route.ts`

- [ ] **Step 1: Guard and throttle passkey registration options**

In `src/app/api/admin/passkeys/register/options/route.ts`, remove `getAdminSession` import and add:

```ts
import { requireAdminMutation } from '@/lib/admin-mutation-guard'
import { consumeRateLimit, makeRequestRateLimitKey } from '@/lib/rate-limit'
```

At the start of `POST`, replace session lookup with:

```ts
  const guard = await requireAdminMutation(request)
  if (!guard.ok) return guard.response

  const rateLimit = await consumeRateLimit(
    makeRequestRateLimitKey('passkey-register-options', request.headers, guard.session.userId),
    5,
    15 * 60 * 1000,
  )
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = guard.session
```

- [ ] **Step 2: Guard and audit passkey registration verification**

In `src/app/api/admin/passkeys/register/verify/route.ts`, remove `getAdminSession` import and add:

```ts
import { requireAdminMutation } from '@/lib/admin-mutation-guard'
import { writeAdminAuditEvent } from '@/lib/audit'
```

At the start of `POST`, replace session lookup with:

```ts
  const guard = await requireAdminMutation(request)
  if (!guard.ok) return guard.response

  const session = guard.session
```

After `prisma.adminPasskey.upsert(...)` and before returning success, add:

```ts
  await writeAdminAuditEvent({
    type: 'passkey.registration',
    userId: session.userId,
    actorEmail: session.user.email,
    headers: request.headers,
    metadata: { credentialId: credential.id, deviceType: credentialDeviceType, backedUp: credentialBackedUp },
  })
```

- [ ] **Step 3: Same-origin guard and throttle passkey login options**

In `src/app/api/admin/passkeys/login/options/route.ts`, add imports:

```ts
import { requireSameOriginRequest } from '@/lib/admin-mutation-guard'
import { consumeRateLimit, makeRequestRateLimitKey } from '@/lib/rate-limit'
```

At the start of `POST`, add:

```ts
  const originFailure = requireSameOriginRequest(request)
  if (originFailure) return originFailure

  const rateLimit = await consumeRateLimit(
    makeRequestRateLimitKey('passkey-login-options', request.headers),
    20,
    15 * 60 * 1000,
  )
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
```

- [ ] **Step 4: Same-origin guard, throttle, and audit passkey login verification**

In `src/app/api/admin/passkeys/login/verify/route.ts`, add imports:

```ts
import { requireSameOriginRequest } from '@/lib/admin-mutation-guard'
import { writeAdminAuditEvent } from '@/lib/audit'
import { consumeRateLimit, makeRequestRateLimitKey } from '@/lib/rate-limit'
```

At the start of `POST`, add:

```ts
  const originFailure = requireSameOriginRequest(request)
  if (originFailure) return originFailure

  const rateLimit = await consumeRateLimit(
    makeRequestRateLimitKey('passkey-login-verify', request.headers),
    20,
    15 * 60 * 1000,
  )
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
```

After `await createAdminSession(passkey.userId)` and before returning success, add:

```ts
  await writeAdminAuditEvent({
    type: 'passkey.login',
    userId: passkey.userId,
    actorEmail: passkey.user.email,
    headers: request.headers,
    metadata: { credentialId: passkey.id },
  })
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript reports no errors.

- [ ] **Step 6: Commit passkey hardening**

Run:

```bash
git add src/app/api/admin/passkeys/register/options/route.ts src/app/api/admin/passkeys/register/verify/route.ts src/app/api/admin/passkeys/login/options/route.ts src/app/api/admin/passkeys/login/verify/route.ts
git commit -m "fix: throttle and audit admin passkeys"
```

---

### Task 8: Production Launch Checklist

**Files:**
- Create: `docs/production-launch-checklist.md`

- [ ] **Step 1: Create deployment checklist**

Create `docs/production-launch-checklist.md`:

```md
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

## Pre-Launch Checks

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build` with production database env vars.
- Confirm Prisma migrations apply successfully.
- Confirm seed fails in production if `ADMIN_PASSWORD` is missing or set to `archipelag`.

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

- Send unauthenticated `PUT /api/admin/settings`; expect `401`.
- Send authenticated admin mutation with mismatched `Origin`; expect `403`.
- Repeat invalid password attempts more than five times in fifteen minutes; expect login failure and an audit row with `login.failure`.
- Inspect database audit rows for `login.success`, `passkey.registration`, `settings.save`, and `catalog.save`.

## Post-Launch Operation

- Store bootstrap password in the client's password manager.
- Prefer passkey login for daily admin use.
- Rotate the bootstrap password after launch handoff.
- Keep `WEBAUTHN_ORIGIN` and `WEBAUTHN_RP_ID` aligned with the final production domain.
```

- [ ] **Step 2: Commit checklist**

Run:

```bash
git add docs/production-launch-checklist.md
git commit -m "docs: add production launch checklist"
```

---

### Task 9: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run pure helper tests**

Run:

```bash
./node_modules/.bin/tsx --test src/lib/admin-security.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS or only pre-existing warnings unrelated to the hardening changes.

- [ ] **Step 4: Run production build with configured database env vars**

Run:

```bash
npm run build
```

Expected: Prisma migrations deploy, seed runs with safe production admin env vars, and Next.js build completes.

- [ ] **Step 5: Manual browser smoke**

Run the checks listed in `docs/production-launch-checklist.md` against the deployment target.

Expected: admin login, passkey registration/login, catalog save, settings save, public calculator, and PNG export all work.

- [ ] **Step 6: Final commit if verification changes were needed**

Run only if Task 9 required code or docs fixes:

```bash
git add <explicit-fixed-paths>
git commit -m "fix: complete production hardening verification"
```

## Self-Review Notes

- Spec coverage: bootstrap credentials are covered by Task 4; mutation guard by Tasks 3 and 5; session policy by Task 3; throttling by Tasks 2, 6, and 7; audit by Tasks 2, 5, 6, and 7; deploy checklist by Task 8; verification by Task 9.
- Placeholder scan: no TBD/TODO markers, no unspecified edge handling, and no out-of-order references.
- Type consistency: helper names used by later tasks are defined before use: `getSessionDurationDays`, `isSameOriginRequest`, `requireAdminMutation`, `requireSameOriginRequest`, `writeAdminAuditEvent`, `consumeRateLimit`, and `makeRequestRateLimitKey`.
