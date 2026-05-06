import { AdminShell } from '@/components/admin/AdminShell'
import { CatalogManager } from '@/components/admin/CatalogManager'
import { getAdminCatalogData } from '@/lib/data'
import { requireAdmin } from '@/lib/auth'

export default async function CatalogPage() {
  const user = await requireAdmin()
  const { goods, settings } = await getAdminCatalogData()

  return (
    <AdminShell active="catalog" userName={user.name}>
      <CatalogManager initialGoods={goods} settings={settings} />
    </AdminShell>
  )
}
