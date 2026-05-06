import type { EstimateLine, GoodView, SettingsView } from '@/types/domain'

const rubleFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
})

const areaFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
})

export function formatRubles(value: number): string {
  return `${rubleFormatter.format(Math.round(value))} ₽`
}

export function formatArea(value: number): string {
  return areaFormatter.format(value)
}

export function formatPriceRule(good: Pick<GoodView, 'pricingMode' | 'pricePerSqm' | 'fixedPrice'>): string {
  if (good.pricingMode === 'fixed') {
    return `${formatRubles(good.fixedPrice ?? 0)} фикс.`
  }

  return `${formatRubles(good.pricePerSqm ?? 0)}/м²`
}

export function calculateGoodAmount(good: GoodView, area: number): number {
  if (good.pricingMode === 'fixed') {
    return good.fixedPrice ?? 0
  }

  return area * (good.pricePerSqm ?? 0)
}

export function calculateEstimateLines(goods: GoodView[], selectedIds: Set<string>, area: number): EstimateLine[] {
  return goods
    .filter((good) => good.enabled && (good.required || selectedIds.has(good.id)))
    .sort((a, b) => a.order - b.order)
    .map((good) => ({
      goodId: good.id,
      name: good.name,
      icon: good.icon,
      color: good.color,
      pricingMode: good.pricingMode,
      priceRule: formatPriceRule(good),
      amount: calculateGoodAmount(good, area),
      required: good.required,
    }))
}

export function calculateTotal(lines: EstimateLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0)
}

export function clampArea(value: number, settings: Pick<SettingsView, 'minArea' | 'maxArea' | 'defaultArea'>): number {
  if (Number.isNaN(value)) return settings.defaultArea
  return Math.min(settings.maxArea, Math.max(settings.minArea, value))
}

export function makeEstimateMessage(area: number, lines: EstimateLine[], total: number, settings: SettingsView): string {
  const goods = lines.length > 0 ? lines.map((line) => `- ${line.name}`).join('\n') : '- Нет выбранных позиций'
  const footer = settings.websiteHandle ? `\n\n${settings.websiteHandle}` : ''

  return [
    'Предварительный расчёт ARCHIPELAG',
    `Площадь: ${formatArea(area)} м²`,
    `Итого: ${formatRubles(total)}`,
    '',
    'Состав расчёта:',
    goods,
    footer,
  ].join('\n')
}

export function makePngFilename(area: number, date: Date, brandName: string): string {
  const safeBrand = brandName.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '') || 'estimate'
  const safeArea = String(area).replace(',', '.').replace(/[^0-9.]+/g, '')
  const localDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
  return `${safeBrand}-estimate-${safeArea}m2-${localDate}.png`
}

export function formatCardDate(isoDate: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate))
}
