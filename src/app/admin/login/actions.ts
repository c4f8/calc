'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createAdminSession, destroyAdminSession, getAdminSession } from '@/lib/auth'
import { writeAdminAuditEvent } from '@/lib/audit'
import { verifyPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'
import { consumeRateLimit, makeRequestRateLimitKey } from '@/lib/rate-limit'

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

export async function logoutAction() {
  const requestHeaders = await headers()
  const session = await getAdminSession()
  await writeAdminAuditEvent({
    type: 'logout',
    userId: session?.userId ?? null,
    actorEmail: session?.user.email ?? null,
    headers: requestHeaders,
  })
  await destroyAdminSession()
  redirect('/admin/login')
}
