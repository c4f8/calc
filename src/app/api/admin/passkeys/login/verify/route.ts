import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from '@simplewebauthn/server'
import { NextResponse } from 'next/server'
import { createAdminSession } from '@/lib/auth'
import { consumePasskeyChallenge, getWebAuthnRequestConfig, parseTransports } from '@/lib/passkeys'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const expectedChallenge = await consumePasskeyChallenge('authentication', null)
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Missing or expired challenge' }, { status: 400 })
  }

  const body = (await request.json()) as AuthenticationResponseJSON
  const passkey = await prisma.adminPasskey.findUnique({
    where: { id: body.id },
    include: { user: true },
  })

  if (!passkey) {
    return NextResponse.json({ error: 'Unknown passkey' }, { status: 400 })
  }

  const { origin, rpID } = getWebAuthnRequestConfig(request)
  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: passkey.id,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: passkey.counter,
      transports: parseTransports(passkey.transports),
    },
  })

  if (!verification.verified) {
    return NextResponse.json({ verified: false }, { status: 400 })
  }

  await prisma.adminPasskey.update({
    where: { id: passkey.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  })

  await createAdminSession(passkey.userId)

  return NextResponse.json({ verified: true })
}
