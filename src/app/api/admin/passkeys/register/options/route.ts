import { generateRegistrationOptions } from '@simplewebauthn/server'
import { NextResponse } from 'next/server'
import { requireAdminMutation } from '@/lib/admin-mutation-guard'
import {
  encodeWebAuthnUserId,
  getWebAuthnRequestConfig,
  parseTransports,
  rememberPasskeyChallenge,
} from '@/lib/passkeys'
import { prisma } from '@/lib/prisma'
import { consumeRateLimit, makeRequestRateLimitKey } from '@/lib/rate-limit'

export async function POST(request: Request) {
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

  const { rpID, rpName } = getWebAuthnRequestConfig(request)
  const passkeys = await prisma.adminPasskey.findMany({ where: { userId: session.userId } })

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: encodeWebAuthnUserId(session.user.id),
    userName: session.user.email,
    userDisplayName: session.user.name,
    timeout: 60_000,
    attestationType: 'none',
    excludeCredentials: passkeys.map((passkey) => ({
      id: passkey.id,
      transports: parseTransports(passkey.transports),
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
  })

  await rememberPasskeyChallenge('registration', session.userId, options.challenge)

  return NextResponse.json(options)
}
