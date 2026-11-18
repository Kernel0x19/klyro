import pkg from '../package.json'

// package.json is the single source of truth for versioning, avoiding stale Vercel env vars
const rawVersion = pkg.version || process.env.NEXT_PUBLIC_VERSION || '0.4.1'

export const APP_VERSION = rawVersion.startsWith('v')
  ? rawVersion
  : `v${rawVersion}`


