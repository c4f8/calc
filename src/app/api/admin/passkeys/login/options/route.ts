import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { NextResponse } from 'next/server'
import { getWebAuthnRequestConfig, parseTransports, rememberPasskeyChallenge } from '@/lib/passkeys'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
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
