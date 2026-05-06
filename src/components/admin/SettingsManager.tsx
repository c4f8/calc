'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, useTransition } from 'react'
import { EstimateCard } from '@/components/calculator/EstimateCard'
import { calculateEstimateLines, calculateTotal } from '@/lib/calc'
import type { EstimateSnapshot, GoodView, SettingsView } from '@/types/domain'

export function SettingsManager({ initialSettings, goods }: { initialSettings: SettingsView; goods: GoodView[] }) {
  const [settings, setSettings] = useState(initialSettings)
  const [sampleIds, setSampleIds] = useState(() => new Set(goods.filter((good) => good.required || good.selectedByDefault).map((good) => good.id)))
  const [status, setStatus] = useState('')
  const [isPending, startTransition] = useTransition()

  const sampleLines = useMemo(() => calculateEstimateLines(goods, sampleIds, settings.defaultArea), [goods, sampleIds, settings.defaultArea])
  const snapshot: EstimateSnapshot = useMemo(() => ({
    area: settings.defaultArea,
    total: calculateTotal(sampleLines),
    lines: sampleLines,
    settings,
    createdAt: new Date().toISOString(),
  }), [sampleLines, settings])

  function patch(update: Partial<SettingsView>) {
    setSettings((current) => ({ ...current, ...update }))
  }

  function toggleSample(good: GoodView) {
    if (good.required) return
    setSampleIds((current) => {
      const next = new Set(current)
      if (next.has(good.id)) next.delete(good.id)
      else next.add(good.id)
      return next
    })
  }

  function save() {
    setStatus('')
    startTransition(async () => {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        setStatus('Не удалось сохранить настройки. Проверьте диапазоны и контакты.')
        return
      }

      setStatus('Настройки сохранены')
      window.setTimeout(() => setStatus(''), 2200)
    })
  }

  return (
    <div className="settings-grid">
      <section className="settings-form panel-card">
        <header className="admin-header-row compact">
          <div>
            <p className="eyebrow">Settings</p>
            <h2>Бренд и расчёт</h2>
            <p className="muted">Изменения видны в карточке справа до сохранения.</p>
          </div>
          <button className="button button-dark" type="button" onClick={save} disabled={isPending}>{isPending ? 'Сохраняем' : 'Сохранить'}</button>
        </header>

        {status ? <p className="save-status">{status}</p> : null}

        <div className="form-grid">
          <label>Название бренда<input value={settings.brandName} onChange={(event) => patch({ brandName: event.target.value })} /></label>
          <label>Короткий знак<input value={settings.shortMark} onChange={(event) => patch({ shortMark: event.target.value })} /></label>
          <label>Instagram без @<input value={settings.instagramHandle} onChange={(event) => patch({ instagramHandle: event.target.value })} /></label>
          <label>Website handle<input value={settings.websiteHandle ?? ''} onChange={(event) => patch({ websiteHandle: event.target.value })} /></label>
          <label>Website URL<input value={settings.websiteUrl ?? ''} onChange={(event) => patch({ websiteUrl: event.target.value })} /></label>
          <label>Налоговая строка<input value={settings.taxLabel ?? ''} onChange={(event) => patch({ taxLabel: event.target.value })} /></label>
          <label>Минимум м²<input type="number" value={settings.minArea} onChange={(event) => patch({ minArea: Number(event.target.value) })} /></label>
          <label>Максимум м²<input type="number" value={settings.maxArea} onChange={(event) => patch({ maxArea: Number(event.target.value) })} /></label>
          <label>По умолчанию м²<input type="number" value={settings.defaultArea} onChange={(event) => patch({ defaultArea: Number(event.target.value) })} /></label>
        </div>

        <div className="sample-goods">
          <p className="eyebrow">Пример состава</p>
          <div>
            {goods.map((good) => (
              <button
                key={good.id}
                type="button"
                className={sampleIds.has(good.id) || good.required ? 'active' : ''}
                onClick={() => toggleSample(good)}
              >
                {good.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="settings-preview">
        <div className="preview-label">Live preview</div>
        <AnimatePresence mode="popLayout">
          <motion.div key={`${settings.brandName}-${settings.shortMark}-${settings.defaultArea}-${sampleLines.length}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="preview-scale">
              <EstimateCard snapshot={snapshot} />
            </div>
          </motion.div>
        </AnimatePresence>
      </aside>
    </div>
  )
}
