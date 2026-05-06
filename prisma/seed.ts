import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'
import { hashPassword } from '../src/lib/password'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? `file:${process.cwd()}/prisma/dev.db` })
const prisma = new PrismaClient({ adapter })

const goods = [
  {
    name: 'Планировка',
    description: 'Планировочные решения',
    icon: 'plan',
    color: '#171717',
    pricingMode: 'area',
    pricePerSqm: 1200,
    fixedPrice: null,
    enabled: true,
    required: true,
    selectedByDefault: true,
    order: 1,
  },
  {
    name: '3D-визуализация',
    description: 'Фотореалистичные рендеры',
    icon: 'chair',
    color: '#d9513f',
    pricingMode: 'area',
    pricePerSqm: 1800,
    fixedPrice: null,
    enabled: true,
    required: false,
    selectedByDefault: true,
    order: 2,
  },
  {
    name: 'Материалы',
    description: 'Подбор и спецификация',
    icon: 'materials',
    color: '#d7ad35',
    pricingMode: 'area',
    pricePerSqm: 700,
    fixedPrice: null,
    enabled: true,
    required: false,
    selectedByDefault: true,
    order: 3,
  },
  {
    name: 'Авторский надзор',
    description: 'Контроль реализации проекта',
    icon: 'helmet',
    color: '#7d7a73',
    pricingMode: 'area',
    pricePerSqm: 1000,
    fixedPrice: null,
    enabled: true,
    required: false,
    selectedByDefault: true,
    order: 4,
  },
  {
    name: 'Обмерный план',
    description: 'Точные замеры помещения',
    icon: 'ruler',
    color: '#e77d35',
    pricingMode: 'area',
    pricePerSqm: 500,
    fixedPrice: null,
    enabled: true,
    required: false,
    selectedByDefault: false,
    order: 5,
  },
  {
    name: 'Подбор освещения',
    description: 'Сценарии света и спецификация',
    icon: 'light',
    color: '#d7d2c8',
    pricingMode: 'area',
    pricePerSqm: 600,
    fixedPrice: null,
    enabled: true,
    required: false,
    selectedByDefault: false,
    order: 6,
  },
  {
    name: 'Комплектация',
    description: 'Ведомость позиций к заказу',
    icon: 'box',
    color: '#4f9d61',
    pricingMode: 'fixed',
    pricePerSqm: null,
    fixedPrice: 50000,
    enabled: true,
    required: false,
    selectedByDefault: true,
    order: 7,
  },
  {
    name: 'Декорирование',
    description: 'Финальный подбор акцентов',
    icon: 'plant',
    color: '#7d7a73',
    pricingMode: 'area',
    pricePerSqm: 900,
    fixedPrice: null,
    enabled: true,
    required: false,
    selectedByDefault: false,
    order: 8,
  },
]

async function main() {
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      brandName: 'ARCHIPELAG',
      shortMark: 'A / G',
      instagramHandle: 'archipelag.design',
      websiteHandle: 'archipelag.design',
      websiteUrl: 'https://archipelag.design',
      taxLabel: 'вкл. НДС',
      minArea: 20,
      maxArea: 500,
      defaultArea: 85,
    },
  })

  await prisma.adminUser.upsert({
    where: { email: 'admin@archipelag.design' },
    update: { name: 'ARCHIPELAG Admin' },
    create: {
      email: 'admin@archipelag.design',
      name: 'ARCHIPELAG Admin',
      passwordHash: hashPassword('archipelag'),
    },
  })

  const existingGoods = await prisma.good.count({ where: { archivedAt: null } })
  if (existingGoods === 0) {
    await prisma.good.createMany({ data: goods })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
