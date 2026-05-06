import Link from 'next/link'
import { logoutAction } from '@/app/admin/login/actions'
import { clsx } from 'clsx'

export function AdminShell({
  active,
  userName,
  children,
}: {
  active: 'catalog' | 'settings'
  userName: string
  children: React.ReactNode
}) {
  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div>
          <div className="brand-row admin-brand">
            <span className="brand-mark">A / G</span>
            <span className="hairline" />
          </div>
          <p className="eyebrow">Admin</p>
          <h1>ARCHIPELAG</h1>
        </div>
        <nav className="admin-nav" aria-label="Администрирование">
          <Link className={clsx('admin-nav-link', active === 'catalog' && 'active')} href="/admin/catalog">Каталог</Link>
          <Link className={clsx('admin-nav-link', active === 'settings' && 'active')} href="/admin/settings">Настройки</Link>
          <Link className="admin-nav-link" href="/">Калькулятор</Link>
        </nav>
        <form action={logoutAction} className="admin-session">
          <span>{userName}</span>
          <button type="submit">Выйти</button>
        </form>
      </aside>
      <section className="admin-content">{children}</section>
    </main>
  )
}
