import 'server-only'
import { getClientIp, hashRateLimitKey } from '@/lib/admin-security'
import { prisma } from '@/lib/prisma'

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

export function makeRequestRateLimitKey(scope: string, headers: Headers, identifier = ''): string {
  return hashRateLimitKey(scope, identifier.toLowerCase(), getClientIp(headers))
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  await prisma.adminRateLimit.deleteMany({ where: { resetAt: { lte: now } } })

  const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "AdminRateLimit" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN "AdminRateLimit"."resetAt" <= ${now} THEN 1
        ELSE "AdminRateLimit"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "AdminRateLimit"."resetAt" <= ${now} THEN ${resetAt}
        ELSE "AdminRateLimit"."resetAt"
      END,
      "updatedAt" = ${now}
    RETURNING "count", "resetAt"
  `

  const result = rows[0]
  if (!result) {
    throw new Error('Rate limit mutation did not return a row')
  }

  const resultingCount = Number(result.count)
  const windowResetAt = new Date(result.resetAt)

  if (resultingCount <= limit) {
    return { allowed: true }
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((windowResetAt.getTime() - now.getTime()) / 1000)),
  }
}
