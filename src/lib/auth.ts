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
    sameSite: 'lax',
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
    if (session) await prisma.adminSession.deleteMany({ where: { id: session.id } })
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
