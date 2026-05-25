import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getClientIp,
  getExpectedOrigin,
  getSessionDurationDays,
  hashRateLimitKey,
  isSameOriginRequest,
} from './admin-security'

function headers(values: Record<string, string>): Headers {
  return new Headers(values)
}

test('production sessions last twelve hours', () => {
  assert.equal(getSessionDurationDays('production'), 0.5)
})

test('development sessions keep thirty day convenience lifetime', () => {
  assert.equal(getSessionDurationDays('development'), 30)
})

test('expected origin prefers configured origin', () => {
  assert.equal(
    getExpectedOrigin(headers({ host: 'wrong.example.com' }), 'https://arch.example.com'),
    'https://arch.example.com',
  )
})

test('expected origin falls back to forwarded host and proto', () => {
  assert.equal(
    getExpectedOrigin(headers({ 'x-forwarded-host': 'arch.example.com', 'x-forwarded-proto': 'https' }), undefined),
    'https://arch.example.com',
  )
})

test('expected origin returns null for invalid configured origin', () => {
  assert.equal(getExpectedOrigin(headers({ host: 'arch.example.com' }), 'not a url'), null)
})

test('expected origin returns null for malformed fallback origin', () => {
  assert.equal(getExpectedOrigin(headers({ 'x-forwarded-host': '[', 'x-forwarded-proto': 'https' }), undefined), null)
})

test('same-origin request passes when origin matches configured production origin', () => {
  assert.equal(
    isSameOriginRequest(
      headers({ origin: 'https://arch.example.com', host: 'arch.example.com' }),
      'https://arch.example.com',
      true,
    ),
    true,
  )
})

test('cross-origin request fails when origin differs', () => {
  assert.equal(
    isSameOriginRequest(
      headers({ origin: 'https://evil.example.com', host: 'arch.example.com' }),
      'https://arch.example.com',
      true,
    ),
    false,
  )
})

test('origin null fails same-origin request in production', () => {
  assert.equal(
    isSameOriginRequest(
      headers({ origin: 'null', host: 'arch.example.com' }),
      'https://arch.example.com',
      true,
    ),
    false,
  )
})

test('malformed request origin fails same-origin request in production', () => {
  assert.equal(
    isSameOriginRequest(
      headers({ origin: 'https://[', host: 'arch.example.com' }),
      'https://arch.example.com',
      true,
    ),
    false,
  )
})

test('production request without origin requires same-origin fetch metadata', () => {
  assert.equal(
    isSameOriginRequest(headers({ host: 'arch.example.com', 'sec-fetch-site': 'same-origin' }), undefined, true),
    true,
  )
  assert.equal(
    isSameOriginRequest(headers({ host: 'arch.example.com', 'sec-fetch-site': 'cross-site' }), undefined, true),
    false,
  )
})

test('production request rejects invalid configured origin before fetch metadata fallback', () => {
  assert.equal(
    isSameOriginRequest(headers({ 'sec-fetch-site': 'same-origin' }), 'not a url', true),
    false,
  )
})

test('production request rejects malformed host-derived origin before fetch metadata fallback', () => {
  assert.equal(
    isSameOriginRequest(headers({ host: 'bad host', 'sec-fetch-site': 'same-origin' }), undefined, true),
    false,
  )
})

test('client IP prefers first forwarded value', () => {
  assert.equal(getClientIp(headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })), '203.0.113.5')
})

test('rate limit keys are stable and scoped without exposing raw identifier', () => {
  const first = hashRateLimitKey('login', 'admin@example.com', '203.0.113.5')
  const second = hashRateLimitKey('login', 'admin@example.com', '203.0.113.5')
  assert.equal(first, second)
  assert.match(first, /^login:[a-f0-9]{64}$/)
  assert.equal(first.includes('admin@example.com'), false)
})

test('rate limit keys avoid tuple collisions from colon-delimited parts', () => {
  assert.notEqual(hashRateLimitKey('scope', 'a:b', 'c'), hashRateLimitKey('scope', 'a', 'b:c'))
})
