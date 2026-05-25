import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Passkey login is disabled' }, { status: 404 })
}
