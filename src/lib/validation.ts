import { z } from 'zod'

export const pricingModeSchema = z.enum(['area', 'fixed'])
export const goodIconSchema = z.enum(['plan', 'chair', 'materials', 'helmet', 'ruler', 'light', 'box', 'plant', 'dots'])

export const goodInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(140).nullable().optional(),
  icon: goodIconSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  pricingMode: pricingModeSchema,
  pricePerSqm: z.coerce.number().int().min(0).nullable().optional(),
  fixedPrice: z.coerce.number().int().min(0).nullable().optional(),
  enabled: z.boolean(),
  required: z.boolean(),
  selectedByDefault: z.boolean(),
  order: z.coerce.number().int().min(0),
})

export const catalogPayloadSchema = z.object({
  goods: z.array(goodInputSchema).max(50),
  archivedIds: z.array(z.string()).max(50).default([]),
})

export const settingsPayloadSchema = z.object({
  brandName: z.string().trim().min(1).max(80),
  shortMark: z.string().trim().min(1).max(24),
  instagramHandle: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9._]+$/),
  websiteHandle: z.string().trim().max(100).nullable().optional(),
  websiteUrl: z.string().trim().url().max(200).nullable().optional().or(z.literal('')),
  taxLabel: z.string().trim().max(40).nullable().optional(),
  minArea: z.coerce.number().positive().max(10000),
  maxArea: z.coerce.number().positive().max(10000),
  defaultArea: z.coerce.number().positive().max(10000),
}).superRefine((value, ctx) => {
  if (value.minArea >= value.maxArea) {
    ctx.addIssue({ code: 'custom', path: ['maxArea'], message: 'Максимум должен быть больше минимума' })
  }

  if (value.defaultArea < value.minArea || value.defaultArea > value.maxArea) {
    ctx.addIssue({ code: 'custom', path: ['defaultArea'], message: 'Площадь по умолчанию должна быть внутри диапазона' })
  }
})
