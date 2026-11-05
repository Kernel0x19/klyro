import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dls/core'],
  experimental: {},
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
