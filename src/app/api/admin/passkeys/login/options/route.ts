import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { NextResponse } from 'next/server'
import { requireSameOriginRequest } from '@/lib/admin-mutation-guard'
import { getWebAuthnRequestConfig, parseTransports, rememberPasskeyChallenge } from '@/lib/passkeys'
import { prisma } from '@/lib/prisma'
import { consumeRateLimit, makeRequestRateLimitKey } from '@/lib/rate-limit'

export async function POST(request: Request) {
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

  const passkeys = await prisma.adminPasskey.findMany()
  if (passkeys.length === 0) {
    return NextResponse.json({ error: 'No passkeys registered' }, { status: 404 })
  }

  const { rpID } = getWebAuthnRequestConfig(request)
  const options = await generateAuthenticationOptions({
    rpID,
    timeout: 60_000,
    userVerification: 'required',
    allowCredentials: passkeys.map((passkey) => ({
      id: passkey.id,
      transports: parseTransports(passkey.transports),
    })),
  })

  await rememberPasskeyChallenge('authentication', null, options.challenge)

  return NextResponse.json(options)
}
