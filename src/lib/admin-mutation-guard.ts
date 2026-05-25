import 'server-only'
import { NextResponse } from 'next/server'
import { isSameOriginRequest } from '@/lib/admin-security'
import { getAdminSession } from '@/lib/auth'

export type AdminMutationSession = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>

export type AdminMutationGuardResult =
  | { ok: true; session: AdminMutationSession }
  | { ok: false; response: NextResponse }

export async function requireAdminMutation(request: Request): Promise<AdminMutationGuardResult> {
  const sameOrigin = isSameOriginRequest(request.headers)
  if (!sameOrigin) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const session = await getAdminSession()
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { ok: true, session }
}

export function requireSameOriginRequest(request: Request): NextResponse | null {
  if (isSameOriginRequest(request.headers)) return null
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
