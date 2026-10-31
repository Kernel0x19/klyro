import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Transpile the @dls/core workspace package
  transpilePackages: ['@dls/core'],

  // Use the app directory (default in Next.js 13+, explicit for clarity)
  experimental: {},

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
}

export default nextConfig
