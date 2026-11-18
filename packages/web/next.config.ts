import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadEnvConfig } from '@next/env'

const projectDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(projectDir, '../..')

import pkg from './package.json'

// Ensure environment variables from both package and monorepo root are loaded
loadEnvConfig(rootDir)
loadEnvConfig(projectDir)

// package.json is the single source of truth for versioning, avoiding stale Vercel env vars
const rawVersion = pkg.version || process.env.NEXT_PUBLIC_VERSION || '0.4.1'


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
