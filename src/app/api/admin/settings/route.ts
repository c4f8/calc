import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { settingsPayloadSchema } from '@/lib/validation'

export async function PUT(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = settingsPayloadSchema.safeParse(await request.json())
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid settings data', issues: payload.error.flatten() }, { status: 400 })
  }

  const data = payload.data

  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {
      brandName: data.brandName,
      shortMark: data.shortMark,
      instagramHandle: data.instagramHandle,
      websiteHandle: data.websiteHandle?.trim() || null,
      websiteUrl: data.websiteUrl?.trim() || null,
      taxLabel: data.taxLabel?.trim() || null,
      minArea: data.minArea,
      maxArea: data.maxArea,
      defaultArea: data.defaultArea,
    },
    create: {
      id: 'default',
      brandName: data.brandName,
      shortMark: data.shortMark,
      instagramHandle: data.instagramHandle,
      websiteHandle: data.websiteHandle?.trim() || null,
      websiteUrl: data.websiteUrl?.trim() || null,
      taxLabel: data.taxLabel?.trim() || null,
      minArea: data.minArea,
      maxArea: data.maxArea,
      defaultArea: data.defaultArea,
    },
  })

  revalidatePath('/')
  revalidatePath('/admin/catalog')
  revalidatePath('/admin/settings')

  return NextResponse.json({ ok: true })
}
