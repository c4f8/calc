import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server'
import { NextResponse } from 'next/server'
import { requireAdminMutation } from '@/lib/admin-mutation-guard'
import { writeAdminAuditEvent } from '@/lib/audit'
import { consumePasskeyChallenge, getWebAuthnRequestConfig, serializeTransports } from '@/lib/passkeys'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const guard = await requireAdminMutation(request)
  if (!guard.ok) return guard.response

  const session = guard.session

  const expectedChallenge = await consumePasskeyChallenge('registration', session.userId)
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Missing or expired challenge' }, { status: 400 })
  }

  const body = (await request.json()) as RegistrationResponseJSON
  const { origin, rpID } = getWebAuthnRequestConfig(request)

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  })

  if (!verification.verified) {
    return NextResponse.json({ verified: false }, { status: 400 })
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

  const existingPasskey = await prisma.adminPasskey.findUnique({
    where: { id: credential.id },
    select: { userId: true },
  })
  if (existingPasskey && existingPasskey.userId !== session.userId) {
    return NextResponse.json({ error: 'Passkey already registered' }, { status: 409 })
  }

  await prisma.adminPasskey.upsert({
    where: { id: credential.id },
    update: {
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: serializeTransports(credential.transports),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    },
    create: {
      id: credential.id,
      userId: session.userId,
      webAuthnUserId: session.userId,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: serializeTransports(credential.transports),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    },
  })

  await writeAdminAuditEvent({
    type: 'passkey.registration',
    userId: session.userId,
    actorEmail: session.user.email,
    headers: request.headers,
    metadata: { credentialId: credential.id, deviceType: credentialDeviceType, backedUp: credentialBackedUp },
  })

  return NextResponse.json({ verified: true })
}
