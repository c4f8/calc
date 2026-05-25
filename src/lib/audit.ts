import 'server-only'
import { createHmac } from 'node:crypto'
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

type AuditMetadataValue = string | number | boolean | null

const MAX_METADATA_ENTRIES = 20
const MAX_METADATA_KEY_LENGTH = 80
const MAX_METADATA_STRING_LENGTH = 300
const SENSITIVE_METADATA_KEY_PATTERN = /password|token|session|secret|challenge|credential|publicKey/i
const STRUCTURAL_METADATA_KEY_PATTERN = /^(__proto__|constructor|prototype)$/i
const AUDIT_IP_HASH_SECRET_PLACEHOLDER = 'replace-with-random-launch-secret'
// Local development fallback only. Production must set AUDIT_IP_HASH_SECRET.
const AUDIT_IP_HASH_DEPLOYMENT_FALLBACK_SECRET = 'AUDIT_IP_HASH_SECRET_NOT_CONFIGURED_DEPLOYMENT_FALLBACK'

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
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  // Intentionally let audit write failures propagate: admin security events fail closed.
  await prisma.adminAuditEvent.create({
    data: {
      type,
      userId: userId ?? null,
      actorEmail: actorEmail ?? null,
      ipHash: headers ? hashIp(getClientIp(headers)) : null,
      userAgent: headers?.get('user-agent')?.slice(0, 300) ?? null,
      metadata: sanitizeAuditMetadata(metadata),
    },
  })
}

function sanitizeAuditMetadata(metadata: Record<string, unknown> | null | undefined): Record<string, AuditMetadataValue> | undefined {
  if (!metadata) {
    return undefined
  }

  const sanitized = Object.create(null) as Record<string, AuditMetadataValue>

  for (const [key, value] of Object.entries(metadata)) {
    if (Object.keys(sanitized).length >= MAX_METADATA_ENTRIES) {
      break
    }

    if (SENSITIVE_METADATA_KEY_PATTERN.test(key) || STRUCTURAL_METADATA_KEY_PATTERN.test(key) || !isAuditMetadataValue(value)) {
      continue
    }

    const sanitizedKey = key.slice(0, MAX_METADATA_KEY_LENGTH)
    if (!sanitizedKey || STRUCTURAL_METADATA_KEY_PATTERN.test(sanitizedKey)) {
      continue
    }

    sanitized[sanitizedKey] = typeof value === 'string' ? value.slice(0, MAX_METADATA_STRING_LENGTH) : value
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

function isAuditMetadataValue(value: unknown): value is AuditMetadataValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
}

function hashIp(ip: string): string {
  return createHmac('sha256', getAuditIpHashSecret())
    .update(ip)
    .digest('hex')
}

function getAuditIpHashSecret(): string {
  const secret = process.env.AUDIT_IP_HASH_SECRET

  if (
    isProductionLikeRuntime() &&
    (!secret || secret === AUDIT_IP_HASH_SECRET_PLACEHOLDER)
  ) {
    throw new Error('Production-like runtime requires AUDIT_IP_HASH_SECRET to be set to a non-placeholder value.')
  }

  return secret || AUDIT_IP_HASH_DEPLOYMENT_FALLBACK_SECRET
}

function isProductionLikeRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV)
}
