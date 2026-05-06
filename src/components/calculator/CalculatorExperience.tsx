'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ExportPanel } from '@/components/calculator/ExportPanel'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { calculateEstimateLines, calculateTotal, clampArea, formatArea, formatPriceRule } from '@/lib/calc'
import { GoodGlyph } from '@/lib/icons'
import type { EstimateSnapshot, GoodView, SettingsView } from '@/types/domain'

function makeInitialSelectedIds(goods: GoodView[]): Set<string> {
  return new Set(goods.filter((good) => good.enabled && (good.required || good.selectedByDefault)).map((good) => good.id))
}

export function CalculatorExperience({ goods, settings }: { goods: GoodView[]; settings: SettingsView }) {
  const [areaInput, setAreaInput] = useState(String(settings.defaultArea))
  const [area, setArea] = useState(settings.defaultArea)
  const [selectedIds, setSelectedIds] = useState(() => makeInitialSelectedIds(goods))
  const [hint, setHint] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<EstimateSnapshot | null>(null)
  const [isEditingGoods, setIsEditingGoods] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const visibleGoods = useMemo(() => goods.filter((good) => good.enabled).sort((a, b) => a.order - b.order), [goods])
  const lines = useMemo(() => calculateEstimateLines(visibleGoods, selectedIds, area), [area, selectedIds, visibleGoods])
  const total = useMemo(() => calculateTotal(lines), [lines])
  const selectedGoodIds = useMemo(() => new Set(lines.map((line) => line.goodId)), [lines])
  const displayedGoods = isEditingGoods ? visibleGoods : visibleGoods.filter((good) => selectedGoodIds.has(good.id))

  function commitArea() {
    const parsed = Number(String(areaInput).replace(',', '.'))
    const nextArea = clampArea(parsed, settings)
    setArea(nextArea)
    setAreaInput(String(nextArea))

    if (parsed !== nextArea) {
      setHint(`Диапазон расчёта: ${formatArea(settings.minArea)}–${formatArea(settings.maxArea)} м²`)
      window.setTimeout(() => setHint(null), 2400)
    }
  }

  function toggleGood(good: GoodView) {
    if (!isEditingGoods) return
    if (good.required) return
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(good.id)) next.delete(good.id)
      else next.add(good.id)
      return next
    })
  }

  function openExport() {
    setSnapshot({
      area,
      total,
      lines,
      settings,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <main className="customer-page">
      <section className="phone-stage">
        <div className="phone-shell">
          <header className="mobile-header">
            <span className="brand-mark">{settings.shortMark}</span>
            <span className="mobile-title">Расчёт интерьера</span>
            <button
              className="menu-button"
              type="button"
              aria-label="Открыть меню"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((value) => !value)}
            >
              <span />
              <span />
              <span />
            </button>
          </header>

          <AnimatePresence>
            {isMenuOpen ? (
              <motion.nav
                className="customer-menu"
                initial={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
                transition={{ duration: 0.24 }}
                aria-label="Меню"
              >
                <Link href="/">Калькулятор</Link>
                <Link href="/admin/catalog">Админ-каталог</Link>
                <Link href="/admin/settings">Настройки</Link>
              </motion.nav>
            ) : null}
          </AnimatePresence>

          <div className="calculator-flow">
            <section className="area-section">
              <label htmlFor="area">Площадь помещения</label>
              <div className="area-input-card">
                <input
                  id="area"
                  inputMode="decimal"
                  value={areaInput}
                  onChange={(event) => setAreaInput(event.target.value)}
                  onBlur={commitArea}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur()
                  }}
                  aria-describedby="area-hint"
                />
                <span className="area-unit">м²</span>
                <span className="area-corners" aria-hidden="true" />
              </div>
              <AnimatePresence>
                {hint ? (
                  <motion.p
                    id="area-hint"
                    className="area-hint"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {hint}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </section>

            <section className="goods-section">
              <div className="section-row selected-row-heading">
                <h1>Выбранные товары</h1>
                <button className="change-link" type="button" onClick={() => setIsEditingGoods((value) => !value)}>
                  {isEditingGoods ? 'Готово' : 'Изменить'}
                </button>
              </div>

              <motion.div className="goods-list">
                <AnimatePresence initial={false}>
                  {displayedGoods.length > 0 ? (
                    displayedGoods.map((good) => {
                      const selected = good.required || selectedIds.has(good.id)
                      return (
                        <motion.button
                          key={good.id}
                          type="button"
                          className={`good-row ${selected ? 'selected' : ''} ${good.required ? 'required' : ''} ${isEditingGoods ? 'editing' : ''}`}
                          aria-pressed={selected}
                          aria-disabled={!isEditingGoods || good.required}
                          disabled={!isEditingGoods || good.required}
                          onClick={() => toggleGood(good)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: selected || isEditingGoods ? 1 : 0.46, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <span className="good-icon">
                            <GoodGlyph name={good.icon} />
                          </span>
                          <span className="good-copy">
                            <span className="good-title-line">
                              <strong>{good.name}</strong>
                              {good.required ? <em>в составе</em> : null}
                            </span>
                            {good.description ? <small>{good.description}</small> : null}
                          </span>
                          <span className="good-price">{formatPriceRule(good)}</span>
                          {isEditingGoods && !good.required ? <span className="good-check" aria-hidden="true" /> : null}
                        </motion.button>
                      )
                    })
                  ) : (
                    <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Выберите товары через «Изменить».
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </section>

            <motion.section className="total-card">
              <div>
                <span>Итого</span>
                <small>для проекта {formatArea(area)} м²</small>
              </div>
              <div className="total-right">
                <AnimatedNumber value={total} />
                {settings.taxLabel ? <small>{settings.taxLabel}</small> : null}
              </div>
            </motion.section>

            <button className="button button-dark share-main" type="button" onClick={openExport}>
              <span>Поделиться расчётом</span>
              <span className="button-arrow" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
      <ExportPanel snapshot={snapshot} onClose={() => setSnapshot(null)} />
    </main>
  )
}
