import 'server-only'
import { prisma } from '@/lib/prisma'
import { toGoodView, toSettingsView } from '@/lib/mappers'
import type { GoodView, SettingsView } from '@/types/domain'

export async function getPublicCalculatorData(): Promise<{ goods: GoodView[]; settings: SettingsView }> {
  const [goods, settings] = await Promise.all([
    prisma.good.findMany({ where: { archivedAt: null, enabled: true }, orderBy: { order: 'asc' } }),
    getSettingsRecord(),
  ])

  return {
    goods: goods.map(toGoodView),
    settings: toSettingsView(settings),
  }
}

export async function getAdminCatalogData(): Promise<{ goods: GoodView[]; settings: SettingsView }> {
  const [goods, settings] = await Promise.all([
    prisma.good.findMany({ where: { archivedAt: null }, orderBy: { order: 'asc' } }),
    getSettingsRecord(),
  ])

  return {
    goods: goods.map(toGoodView),
    settings: toSettingsView(settings),
  }
}

export async function getSettingsRecord() {
  return prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  })
}
