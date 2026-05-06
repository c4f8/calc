import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const databaseUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/archipelag'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
})
