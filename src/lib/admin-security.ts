import { createHash } from 'node:crypto'

type ExpectedOriginState =
  | { state: 'valid'; origin: string }
  | { state: 'invalid' }
  | { state: 'absent' }

export function getSessionDurationDays(nodeEnv = process.env.NODE_ENV): number {
  return nodeEnv === 'production' ? 0.5 : 30
}

export function getClientIp(headers: Headers): string {
  // Deployment assumption: Vercel/proxy edge is trusted to set forwarding headers.
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  return headers.get('x-real-ip')?.trim() || 'unknown'
}

export function getExpectedOrigin(headers: Headers, configuredOrigin = process.env.WEBAUTHN_ORIGIN): string | null {
  const expectedOrigin = getExpectedOriginState(headers, configuredOrigin)
  return expectedOrigin.state === 'valid' ? expectedOrigin.origin : null
}

function getExpectedOriginState(headers: Headers, configuredOrigin = process.env.WEBAUTHN_ORIGIN): ExpectedOriginState {
  if (configuredOrigin) {
    const origin = normalizeOrigin(configuredOrigin)
    return origin ? { state: 'valid', origin } : { state: 'invalid' }
  }

  const host = firstHeaderValue(headers.get('x-forwarded-host')) || firstHeaderValue(headers.get('host'))
  if (!host) return { state: 'absent' }

  const proto = firstHeaderValue(headers.get('x-forwarded-proto')) || 'https'
  const origin = normalizeOrigin(`${proto}://${host}`)
  return origin ? { state: 'valid', origin } : { state: 'invalid' }
}

export function isSameOriginRequest(
  headers: Headers,
  configuredOrigin = process.env.WEBAUTHN_ORIGIN,
  production = process.env.NODE_ENV === 'production',
): boolean {
  const expectedOrigin = getExpectedOriginState(headers, configuredOrigin)
  const requestOrigin = headers.get('origin')

  if (expectedOrigin.state === 'invalid') return false

  if (requestOrigin) {
    const normalizedRequestOrigin = normalizeOrigin(requestOrigin)
    if (!normalizedRequestOrigin) return false

    if (expectedOrigin.state === 'valid' && normalizedRequestOrigin === expectedOrigin.origin) {
      return true
    }

    const hostOrigin = getExpectedOriginState(headers, undefined)
    return hostOrigin.state === 'valid' && normalizedRequestOrigin === hostOrigin.origin
  }

  const fetchSite = headers.get('sec-fetch-site')
  if (fetchSite) return fetchSite === 'same-origin'

  return !production
}

export function hashRateLimitKey(scope: string, ...parts: Array<string | null | undefined>): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(parts.map((part) => part || '')))
    .digest('hex')

  return `${scope}:${hash}`
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null
}

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return null
  }
}
