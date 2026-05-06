import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { formatArea, formatCardDate, formatRubles } from '@/lib/calc'
import { GoodGlyph } from '@/lib/icons'
import type { EstimateSnapshot } from '@/types/domain'

function getDensity(count: number): 'spacious' | 'compact' | 'micro' | 'ultra' {
  if (count <= 4) return 'spacious'
  if (count <= 8) return 'compact'
  if (count <= 12) return 'micro'
  return 'ultra'
}

export const EstimateCard = forwardRef<HTMLElement, { snapshot: EstimateSnapshot; exportMode?: boolean }>(
  function EstimateCard({ snapshot, exportMode = false }, ref) {
    const density = getDensity(snapshot.lines.length)
    const website = snapshot.settings.websiteHandle
    const instagram = snapshot.settings.instagramHandle ? `@${snapshot.settings.instagramHandle}` : ''

    return (
      <article ref={ref} className={clsx('estimate-card', `density-${density}`, exportMode && 'export-mode')}>
        <header className="estimate-card-header">
          <div className="estimate-brand-name">{snapshot.settings.brandName}</div>
          <div className="estimate-brand-mark">{snapshot.settings.shortMark}</div>
        </header>

        <section className="estimate-hero">
          <p>Предварительный расчёт</p>
          <div className="estimate-area">
            <span>{formatArea(snapshot.area)}</span>
            <small>м²</small>
          </div>
          <div className="estimate-total">{formatRubles(snapshot.total)}</div>
        </section>

        <section className="estimate-lines" aria-label="Состав расчёта">
          <div className="estimate-section-title">Состав расчёта</div>
          {snapshot.lines.length > 0 ? (
            <div className="estimate-line-list">
              {snapshot.lines.map((line) => (
                <div className="estimate-line" key={line.goodId}>
                  <span className="estimate-line-icon">
                    <GoodGlyph name={line.icon} />
                  </span>
                  <span className="estimate-line-name">{line.name}</span>
                  {density === 'ultra' ? null : <span className="estimate-line-rule">{line.priceRule}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="estimate-empty">Позиции не выбраны</div>
          )}
        </section>

        <section className="estimate-card-summary">
          <div>
            <span>Итого для проекта {formatArea(snapshot.area)} м²</span>
            <small>{snapshot.settings.taxLabel || ' '}</small>
          </div>
          <strong>{formatRubles(snapshot.total)}</strong>
        </section>

        <p className="estimate-disclaimer">Расчёт предварительный. Финальная стоимость уточняется после обсуждения проекта.</p>

        <footer className="estimate-footer">
          <span>{instagram}</span>
          <span>{formatCardDate(snapshot.createdAt)}</span>
          <span>{website}</span>
        </footer>
      </article>
    )
  }
)
