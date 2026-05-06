import type { NextConfig } from 'next'
import path from 'node:path'

const projectRoot = __dirname

const nextConfig: NextConfig = {
  typedRoutes: false,
  devIndicators: false,
  allowedDevOrigins: [
    '192.168.2.62',
    '192.168.2.62:3000',
    '192.168.2.62:3001',
    '192.168.2.62:3002',
    'http://192.168.2.62:3000',
    'http://192.168.2.62:3001',
    'http://192.168.2.62:3002',
  ],
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.git/**',
          '**/.next/**',
          '**/node_modules/**',
          path.join(projectRoot, 'Brandbook_ARCHIPELAG/**'),
          path.join(projectRoot, 'src/generated/prisma/**'),
          path.join(projectRoot, 'prisma/dev.db*'),
          path.join(projectRoot, '.playwright-mcp/**'),
        ],
      }
    }

    return config
  },
}

export default nextConfig
