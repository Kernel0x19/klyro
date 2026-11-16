import pkg from '../package.json'

const rawVersion =
  process.env.NEXT_PUBLIC_VERSION ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.VERSION ||
  process.env.APP_VERSION ||
  pkg.version

export const APP_VERSION = rawVersion.startsWith('v')
  ? rawVersion
  : `v${rawVersion}`

