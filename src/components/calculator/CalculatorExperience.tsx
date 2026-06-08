'use client'

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ExportPanel } from '@/components/calculator/ExportPanel'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { calculateEstimateLines, calculateTotal, clampArea, formatArea, formatCalculationMode, formatPriceRule, hasDifferentModePrices, isGoodAvailableInMode } from '@/lib/calc'
import { GoodGlyph } from '@/lib/icons'
import type { CalculationMode, EstimateSnapshot, GoodView, SettingsView } from '@/types/domain'

function makeInitialSelectedIds(goods: GoodView[]): Set<string> {
  return new Set(goods.filter((good) => good.enabled && (good.required || good.selectedByDefault)).map((good) => good.id))
}

const calculationModes: CalculationMode[] = ['express', 'individual']
const liquidEase: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function CalculatorExperience({ goods, settings }: { goods: GoodView[]; settings: SettingsView }) {
  const [areaInput, setAreaInput] = useState(String(settings.defaultArea))
  const [area, setArea] = useState(settings.defaultArea)
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('express')
  const [selectedIds, setSelectedIds] = useState(() => makeInitialSelectedIds(goods))
  const [hint, setHint] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<EstimateSnapshot | null>(null)
  const [isEditingGoods, setIsEditingGoods] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const liquidTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.46, ease: liquidEase }
  const presenceTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: liquidEase }

  const visibleGoods = useMemo(
    () => goods.filter((good) => good.enabled && isGoodAvailableInMode(good, calculationMode)).sort((a, b) => a.order - b.order),
    [calculationMode, goods]
  )
  const lines = useMemo(() => calculateEstimateLines(visibleGoods, selectedIds, area, calculationMode), [area, calculationMode, selectedIds, visibleGoods])
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

  function selectCalculationMode(mode: CalculationMode) {
    if (mode === calculationMode) return
    setCalculationMode(mode)
  }

  function openExport() {
    setSnapshot({
      calculationMode,
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

          <LayoutGroup id="calculator-state">
            <motion.div className="calculator-flow" layout transition={liquidTransition}>
              <motion.section className="area-section" layout transition={liquidTransition}>
                <label htmlFor="area">Площадь помещения</label>
                <motion.label className="area-input-card" htmlFor="area" layout transition={liquidTransition}>
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
                  <span className="area-unit" aria-hidden="true">м²</span>
                  <span className="area-corners" aria-hidden="true" />
                </motion.label>
                <AnimatePresence>
                  {hint ? (
                    <motion.p
                      id="area-hint"
                      className="area-hint"
                      layout
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={presenceTransition}
                    >
                      {hint}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.section>

              <motion.section className="goods-section" layout transition={liquidTransition}>
                <motion.div className="section-row selected-row-heading" layout transition={liquidTransition}>
                  <motion.h1 layout="position" transition={liquidTransition}>Выбранные товары</motion.h1>
                  <motion.button className="change-link" type="button" layout onClick={() => setIsEditingGoods((value) => !value)} transition={liquidTransition}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={isEditingGoods ? 'done' : 'edit'}
                        initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -5, filter: 'blur(4px)' }}
                        transition={presenceTransition}
                      >
                        {isEditingGoods ? 'Готово' : 'Изменить'}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </motion.div>

                <motion.div className="mode-segment" role="tablist" aria-label="Тип расчёта" layout transition={liquidTransition}>
                  {calculationModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={calculationMode === mode}
                      className={calculationMode === mode ? 'active' : ''}
                      onClick={() => selectCalculationMode(mode)}
                    >
                      {calculationMode === mode ? (
                        <motion.span className="mode-segment-thumb" layoutId="mode-segment-thumb" transition={liquidTransition} aria-hidden="true" />
                      ) : null}
                      <span className="mode-segment-label">{formatCalculationMode(mode)}</span>
                    </button>
                  ))}
                </motion.div>

                <motion.div className="goods-list" layout transition={liquidTransition}>
                  <AnimatePresence initial={false} mode="popLayout">
                    {displayedGoods.length > 0 ? (
                      displayedGoods.map((good, index) => {
                        const selected = good.required || selectedIds.has(good.id)
                        return (
                          <motion.button
                            key={good.id}
                            layout
                            type="button"
                            className={`good-row ${selected ? 'selected' : ''} ${good.required ? 'required' : ''} ${isEditingGoods ? 'editing' : ''}`}
                            aria-pressed={selected}
                            aria-disabled={!isEditingGoods || good.required}
                            disabled={!isEditingGoods || good.required}
                            onClick={() => toggleGood(good)}
                            initial={{ opacity: 0, y: 14, scale: 0.985, filter: 'blur(8px)' }}
                            animate={{ opacity: selected ? 1 : 0.62, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -12, scale: 0.985, filter: 'blur(7px)' }}
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : { duration: 0.34, ease: liquidEase, delay: Math.min(index, 5) * 0.018, layout: { duration: 0.46, ease: liquidEase } }
                            }
                          >
                            <motion.span className="good-icon" layout transition={liquidTransition}>
                              <GoodGlyph name={good.icon} />
                            </motion.span>
                            <motion.span className="good-copy" layout="position" transition={liquidTransition}>
                              <span className="good-title-line">
                                <strong>{good.name}</strong>
                                {good.required ? <em>в составе</em> : null}
                              </span>
                              {good.description ? <small>{good.description}</small> : null}
                            </motion.span>
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={`${good.id}-${calculationMode}`}
                                className="good-price-stack"
                                layout="position"
                                initial={{ opacity: 0, y: 6, filter: 'blur(5px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -6, filter: 'blur(5px)' }}
                                transition={presenceTransition}
                              >
                                <span className="good-price">{formatPriceRule(good, calculationMode)}</span>
                                {hasDifferentModePrices(good) ? (
                                  <small>{formatPriceRule(good, calculationMode === 'express' ? 'individual' : 'express')}</small>
                                ) : null}
                              </motion.span>
                            </AnimatePresence>
                            <AnimatePresence initial={false}>
                              {isEditingGoods && !good.required ? (
                                <motion.span
                                  className="good-check"
                                  layout
                                  initial={{ opacity: 0, scale: 0.72, filter: 'blur(4px)' }}
                                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                  exit={{ opacity: 0, scale: 0.72, filter: 'blur(4px)' }}
                                  transition={presenceTransition}
                                  aria-hidden="true"
                                />
                              ) : null}
                            </AnimatePresence>
                          </motion.button>
                        )
                      })
                    ) : (
                      <motion.div
                        className="empty-state"
                        layout
                        initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                        transition={presenceTransition}
                      >
                        Выберите товары через «Изменить».
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.section>

              <motion.div className="summary-stack" layout transition={liquidTransition}>
                <motion.section className="total-card" layout transition={liquidTransition}>
                  <motion.div layout="position" transition={liquidTransition}>
                    <span>Итого</span>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.small
                        key={`${calculationMode}-${area}`}
                        className="total-meta"
                        initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
                        transition={presenceTransition}
                      >
                        {formatCalculationMode(calculationMode)} · {formatArea(area)} м²
                      </motion.small>
                    </AnimatePresence>
                  </motion.div>
                  <motion.div className="total-right" layout="position" transition={liquidTransition}>
                    <AnimatedNumber value={total} />
                    {settings.taxLabel ? <small>{settings.taxLabel}</small> : null}
                  </motion.div>
                </motion.section>

                <motion.button className="button button-dark share-main" type="button" layout transition={liquidTransition} onClick={openExport}>
                  <span>Поделиться расчётом</span>
                  <span className="button-arrow" aria-hidden="true" />
                </motion.button>
              </motion.div>
            </motion.div>
          </LayoutGroup>
        </div>
      </section>
      <ExportPanel snapshot={snapshot} onClose={() => setSnapshot(null)} />
    </main>
  )
}
