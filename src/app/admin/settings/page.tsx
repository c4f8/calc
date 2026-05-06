import { AdminShell } from '@/components/admin/AdminShell'
import { SettingsManager } from '@/components/admin/SettingsManager'
import { getAdminCatalogData } from '@/lib/data'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireAdmin()
  const { goods, settings } = await getAdminCatalogData()

  return (
    <AdminShell active="settings" userName={user.name}>
      <SettingsManager initialSettings={settings} goods={goods.filter((good) => good.enabled)} />
    </AdminShell>
  )
}
