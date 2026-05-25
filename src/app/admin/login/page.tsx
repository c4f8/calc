import { loginAction } from './actions'
import { getAdminSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession()
  if (session) redirect('/admin/catalog')

  const params = await searchParams

  return (
    <main className="login-page">
      <section className="login-card panel-card">
        <div className="brand-row">
          <span className="brand-mark">A / G</span>
          <span className="hairline" />
        </div>
        <p className="eyebrow">Администрирование</p>
        <h1>Вход в каталог</h1>
        <p className="muted">Введите логин и пароль администратора.</p>
        <form action={loginAction} className="stack-form" autoComplete="off">
          <label>
            Логин
            <input name="login" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} required />
          </label>
          <label>
            Пароль
            <input name="password" type="password" autoComplete="off" required />
          </label>
          {params.error ? <p className="form-error">Неверный логин или пароль.</p> : null}
          <button className="button button-dark" type="submit">Войти</button>
        </form>
      </section>
    </main>
  )
}
