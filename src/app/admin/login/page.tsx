import { loginAction } from './actions'
import { PasskeyLogin } from '@/components/admin/PasskeyLogin'
import { getAdminSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

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
        <p className="muted">Основной вход для клиента — passkey. Пароль остаётся только как резерв для настройки.</p>
        <PasskeyLogin />
        <form action={loginAction} className="stack-form">
          <p className="eyebrow">Резервный вход</p>
          <label>
            Email
            <input name="email" type="email" defaultValue="admin@archipelag.design" autoComplete="email" required />
          </label>
          <label>
            Пароль
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {params.error ? <p className="form-error">Неверный email или пароль.</p> : null}
          <button className="button button-dark" type="submit">Войти</button>
        </form>
      </section>
    </main>
  )
}
