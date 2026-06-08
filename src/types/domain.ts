export type PricingMode = 'area' | 'fixed'
export type CalculationMode = 'express' | 'individual'

export type GoodIcon =
  | 'plan'
  | 'chair'
  | 'materials'
  | 'helmet'
  | 'ruler'
  | 'light'
  | 'box'
  | 'plant'
  | 'dots'

export interface GoodView {
  id: string
  name: string
  description: string | null
  icon: GoodIcon
  color: string
  pricingMode: PricingMode
  pricePerSqm: number | null
  fixedPrice: number | null
  individualPricePerSqm: number | null
  individualFixedPrice: number | null
  availableInExpress: boolean
  availableInIndividual: boolean
  enabled: boolean
  required: boolean
  selectedByDefault: boolean
  order: number
}

export interface SettingsView {
  brandName: string
  shortMark: string
  instagramHandle: string
  websiteHandle: string | null
  websiteUrl: string | null
  taxLabel: string | null
  minArea: number
  maxArea: number
  defaultArea: number
}

export interface EstimateLine {
  goodId: string
  name: string
  icon: GoodIcon
  color: string
  calculationMode: CalculationMode
  pricingMode: PricingMode
  priceRule: string
  amount: number
  required: boolean
}

export interface EstimateSnapshot {
  calculationMode: CalculationMode
  area: number
  total: number
  lines: EstimateLine[]
  settings: SettingsView
  createdAt: string
}
