import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadEnvConfig } from '@next/env'

const projectDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(projectDir, '../..')

// Ensure environment variables from both package and monorepo root are loaded
loadEnvConfig(rootDir)
loadEnvConfig(projectDir)

const rawVersion =
  process.env.NEXT_PUBLIC_VERSION ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.VERSION ||
  process.env.APP_VERSION ||
  'v0.2.2'

const formattedVersion = rawVersion.startsWith('v')
  ? rawVersion
  : `v${rawVersion}`

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dls/core'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: formattedVersion,
    NEXT_PUBLIC_VERSION: formattedVersion,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

export default nextConfig
