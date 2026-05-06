'use client'

import { startAuthentication } from '@simplewebauthn/browser'
import { useEffect, useState, useTransition } from 'react'

export function PasskeyLogin() {
  const [isSecure, setIsSecure] = useState<boolean | null>(null)
  const [status, setStatus] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsSecure(window.isSecureContext))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  function loginWithPasskey() {
    setStatus('')

    startTransition(async () => {
      try {
        const optionsResponse = await fetch('/api/admin/passkeys/login/options', { method: 'POST' })
        if (optionsResponse.status === 404) {
          setStatus('Passkey ещё не привязан. Войдите резервным способом и создайте passkey в настройках.')
          return
        }

        if (!optionsResponse.ok) {
          setStatus('Не удалось начать вход по passkey.')
          return
        }

        const optionsJSON = await optionsResponse.json()
        const credential = await startAuthentication({ optionsJSON })

        const verifyResponse = await fetch('/api/admin/passkeys/login/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credential),
        })

        if (!verifyResponse.ok) {
          setStatus('Passkey не принят. Попробуйте ещё раз.')
          return
        }

        window.location.href = '/admin/catalog'
      } catch {
        setStatus('Вход отменён или недоступен на этом устройстве.')
      }
    })
  }

  return (
    <section className="passkey-login">
      <button className="button button-dark passkey-button" type="button" onClick={loginWithPasskey} disabled={isPending || isSecure !== true}>
        {isPending ? 'Откройте passkey…' : 'Войти по passkey'}
      </button>
      {isSecure === false ? (
        <p className="auth-note">Passkey работает на HTTPS или localhost. Для iPhone нужен домен с HTTPS, не LAN http-адрес.</p>
      ) : null}
      {status ? <p className="form-error">{status}</p> : null}
    </section>
  )
}
