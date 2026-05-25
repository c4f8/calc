import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { hashPassword } from '../src/lib/password'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.')
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })
const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', 'host.docker.internal'])
const ADMIN_PASSWORD_PLACEHOLDERS = new Set([
  'archipelag',
  'replace-with-a-unique-launch-password',
  'password',
  'changeme',
  'change-me',
])

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

function getBootstrapAdmin() {
  const isProductionLike = isProductionLikeSeedEnvironment()
  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() || (isProductionLike ? '' : 'admin@archipelag.design')
  const name = process.env.ADMIN_NAME?.trim() || (isProductionLike ? '' : 'ARCHIPELAG Admin')
  const password = process.env.ADMIN_PASSWORD || (isProductionLike ? '' : 'archipelag')

  if (isProductionLike) {
    if (!email || !name || !password) {
      throw new Error('Production-like seed requires ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD')
    }

    if (ADMIN_PASSWORD_PLACEHOLDERS.has(password.trim().toLowerCase()) || password.length < 14) {
      throw new Error('Production-like ADMIN_PASSWORD must be unique and at least 14 characters')
    }
  }

  return { email, name, password }
}

function isProductionLikeSeedEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_ENV) ||
    hasRemoteDatabaseHost(process.env.DATABASE_URL)
  )
}

function hasRemoteDatabaseHost(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  try {
    const host = new URL(value).hostname.toLowerCase()
    return Boolean(host) && !LOCAL_DATABASE_HOSTS.has(host)
  } catch {
    return false
  }
}

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

  const admin = getBootstrapAdmin()
  await prisma.adminUser.upsert({
    where: { email: admin.email },
    update: { name: admin.name },
    create: {
      email: admin.email,
      name: admin.name,
      passwordHash: hashPassword(admin.password),
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
