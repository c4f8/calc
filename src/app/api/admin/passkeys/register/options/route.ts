import { generateRegistrationOptions } from '@simplewebauthn/server'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import {
  encodeWebAuthnUserId,
  getWebAuthnRequestConfig,
  parseTransports,
  rememberPasskeyChallenge,
} from '@/lib/passkeys'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
