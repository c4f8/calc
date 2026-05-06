'use client'

import { startRegistration } from '@simplewebauthn/browser'
import { useEffect, useState, useTransition } from 'react'

export function PasskeyManager() {
  const [isSecure, setIsSecure] = useState<boolean | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsSecure(window.isSecureContext))

    fetch('/api/admin/passkeys/status')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { count: number } | null) => setCount(data?.count ?? 0))
      .catch(() => setCount(null))

    return () => window.cancelAnimationFrame(frame)
  }, [])

  function registerPasskey() {
    setStatus('')

    startTransition(async () => {
      try {
        const optionsResponse = await fetch('/api/admin/passkeys/register/options', { method: 'POST' })
        if (!optionsResponse.ok) {
          setStatus('Не удалось подготовить passkey.')
          return
        }

        const optionsJSON = await optionsResponse.json()
        const credential = await startRegistration({ optionsJSON })

        const verifyResponse = await fetch('/api/admin/passkeys/register/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credential),
        })

        if (!verifyResponse.ok) {
          setStatus('Passkey не сохранён. Попробуйте ещё раз.')
          return
        }

        setCount((value) => (value ?? 0) + 1)
        setStatus('Passkey привязан. Следующий вход можно сделать без пароля.')
      } catch {
        setStatus('Создание passkey отменено или недоступно на этом устройстве.')
      }
    })
  }

  return (
    <section className="passkey-card panel-card">
      <div>
        <p className="eyebrow">Passkey</p>
        <h2>Вход без пароля</h2>
        <p className="muted">
          Привяжите Face ID, Touch ID или системный passkey. После этого клиент сможет входить в админку одной кнопкой.
        </p>
      </div>
      <div className="passkey-actions">
        <span className="passkey-count">{count === null ? 'Проверяем…' : `${count} passkey`}</span>
        <button className="button button-dark" type="button" onClick={registerPasskey} disabled={isPending || isSecure !== true}>
          {isPending ? 'Откройте passkey…' : 'Привязать passkey'}
        </button>
      </div>
      {isSecure === false ? (
        <p className="auth-note">Passkey нельзя создать на небезопасном LAN-адресе. Используйте `localhost` на компьютере или HTTPS-домен на iPhone.</p>
      ) : null}
      {status ? <p className="save-status">{status}</p> : null}
    </section>
  )
}
