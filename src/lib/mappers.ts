import type { Good, Settings } from '@/generated/prisma/client'
import type { GoodIcon, GoodView, PricingMode, SettingsView } from '@/types/domain'

const validIcons = new Set(['plan', 'chair', 'materials', 'helmet', 'ruler', 'light', 'box', 'plant', 'dots'])
const validPricingModes = new Set(['area', 'fixed'])

export function toGoodView(good: Good): GoodView {
  return {
    id: good.id,
    name: good.name,
    description: good.description,
    icon: (validIcons.has(good.icon) ? good.icon : 'dots') as GoodIcon,
    color: good.color,
    pricingMode: (validPricingModes.has(good.pricingMode) ? good.pricingMode : 'area') as PricingMode,
    pricePerSqm: good.pricePerSqm,
    fixedPrice: good.fixedPrice,
    enabled: good.enabled,
    required: good.required,
    selectedByDefault: good.selectedByDefault,
    order: good.order,
  }
}

export function toSettingsView(settings: Settings): SettingsView {
  return {
    brandName: settings.brandName,
    shortMark: settings.shortMark,
    instagramHandle: settings.instagramHandle,
    websiteHandle: settings.websiteHandle,
    websiteUrl: settings.websiteUrl,
    taxLabel: settings.taxLabel,
    minArea: settings.minArea,
    maxArea: settings.maxArea,
    defaultArea: settings.defaultArea,
  }
}
