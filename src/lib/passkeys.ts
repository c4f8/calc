import 'server-only'
import { cookies } from 'next/headers'
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { prisma } from '@/lib/prisma'

export const PASSKEY_CHALLENGE_COOKIE = 'archipelag_passkey_challenge'
export const PASSKEY_CHALLENGE_TTL_MS = 5 * 60 * 1000

export type PasskeyChallengeType = 'registration' | 'authentication'

export function getWebAuthnRequestConfig(request: Request) {
  const url = new URL(request.url)

  return {
    origin: process.env.WEBAUTHN_ORIGIN ?? url.origin,
    rpID: process.env.WEBAUTHN_RP_ID ?? url.hostname,
    rpName: process.env.WEBAUTHN_RP_NAME ?? 'ARCHIPELAG Admin',
  }
}

export function encodeWebAuthnUserId(userId: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(userId)
  const copy = new ArrayBuffer(encoded.byteLength)
  new Uint8Array(copy).set(encoded)
  return new Uint8Array(copy)
}

export function parseTransports(value: string | null): AuthenticatorTransportFuture[] | undefined {
  if (!value) return undefined

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export function serializeTransports(value: AuthenticatorTransportFuture[] | undefined): string | null {
  return value?.length ? JSON.stringify(value) : null
}

export async function rememberPasskeyChallenge(type: PasskeyChallengeType, userId: string | null, challenge: string) {
  await prisma.adminAuthChallenge.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  })

  const record = await prisma.adminAuthChallenge.create({
    data: {
      type,
      userId,
      challenge,
      expiresAt: new Date(Date.now() + PASSKEY_CHALLENGE_TTL_MS),
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(PASSKEY_CHALLENGE_COOKIE, record.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PASSKEY_CHALLENGE_TTL_MS / 1000,
  })
}

export async function consumePasskeyChallenge(type: PasskeyChallengeType, userId?: string | null): Promise<string | null> {
  const cookieStore = await cookies()
  const challengeId = cookieStore.get(PASSKEY_CHALLENGE_COOKIE)?.value
  if (!challengeId) return null

  const record = await prisma.adminAuthChallenge.findUnique({ where: { id: challengeId } })
  cookieStore.delete(PASSKEY_CHALLENGE_COOKIE)

  if (!record) return null

  await prisma.adminAuthChallenge.deleteMany({ where: { id: record.id } })

  if (record.type !== type) return null
  if (record.expiresAt <= new Date()) return null
  if (userId !== undefined && record.userId !== userId) return null

  return record.challenge
}
