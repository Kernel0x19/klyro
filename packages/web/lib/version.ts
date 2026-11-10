const rawVersion =
  process.env.NEXT_PUBLIC_VERSION ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.VERSION ||
  process.env.APP_VERSION ||
  'v0.3.1'

export const APP_VERSION = rawVersion.startsWith('v')
  ? rawVersion
  : `v${rawVersion}`
