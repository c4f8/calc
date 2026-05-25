import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminMutation } from '@/lib/admin-mutation-guard'
import { writeAdminAuditEvent } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { catalogPayloadSchema } from '@/lib/validation'

export async function PUT(request: Request) {
  const guard = await requireAdminMutation(request)
  if (!guard.ok) return guard.response

  const payload = catalogPayloadSchema.safeParse(await request.json())
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid catalog data', issues: payload.error.flatten() }, { status: 400 })
  }

  const { goods, archivedIds } = payload.data

  await prisma.$transaction(async (tx) => {
    if (archivedIds.length > 0) {
      await tx.good.updateMany({
        where: { id: { in: archivedIds } },
        data: { archivedAt: new Date(), enabled: false },
      })
    }

    for (const [index, good] of goods.entries()) {
      const data = {
        name: good.name,
        description: good.description?.trim() || null,
        icon: good.icon,
        color: good.color,
        pricingMode: good.pricingMode,
        pricePerSqm: good.pricingMode === 'area' ? good.pricePerSqm ?? 0 : null,
        fixedPrice: good.pricingMode === 'fixed' ? good.fixedPrice ?? 0 : null,
        enabled: good.enabled,
        required: good.required,
        selectedByDefault: good.required ? true : good.selectedByDefault,
        order: index + 1,
        archivedAt: null,
      }

      if (good.id && !good.id.startsWith('new-')) {
        await tx.good.update({ where: { id: good.id }, data })
      } else {
        await tx.good.create({ data })
      }
    }
  })

  await writeAdminAuditEvent({
    type: 'catalog.save',
    userId: guard.session.userId,
    actorEmail: guard.session.user.email,
    headers: request.headers,
    metadata: { goods: goods.length, archived: archivedIds.length },
  })

  revalidatePath('/')
  revalidatePath('/admin/catalog')
  revalidatePath('/admin/settings')

  return NextResponse.json({ ok: true })
}
