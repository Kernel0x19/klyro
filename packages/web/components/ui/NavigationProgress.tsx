'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'

NProgress.configure({
  minimum: 0.08,
  easing: 'ease',
  speed: 300,
  showSpinner: false,
  trickleSpeed: 200,
  trickle: true,
})

/**
 * Patches history.pushState / replaceState so that every navigation
 * (router.push, <Link>, window.location.assign, redirects) triggers NProgress.
 *
 * Uses pathname + searchParams change to complete the bar — meaning the bar
 * always finishes exactly when the new page has mounted, never prematurely.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const patched = useRef(false)
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Patch history once on mount ──────────────────────────────────────────
  useEffect(() => {
    if (patched.current) return
    patched.current = true

    function startProgress(nextUrl: string) {
      try {
        const current = new URL(window.location.href)
        const next = new URL(nextUrl, window.location.href)

        // Only trigger for same-origin navigations that change the path or search
        if (next.origin !== current.origin) return
        if (
          next.pathname === current.pathname &&
          next.search === current.search
        ) {
          return
        }
      } catch {
        // If URL parsing fails, proceed anyway
      }

      if (safetyTimer.current) clearTimeout(safetyTimer.current)
      NProgress.start()

      // Safety: auto-complete after 10s if the route never resolves
      safetyTimer.current = setTimeout(() => {
        NProgress.done()
      }, 10_000)
    }

    // Patch pushState (all router.push / <Link> navigations go through this)
    const origPush = history.pushState.bind(history)
    history.pushState = function (state, title, url) {
      if (url) startProgress(String(url))
      return origPush(state, title, url)
    }

    // Patch replaceState (redirects & router.replace)
    const origReplace = history.replaceState.bind(history)
    history.replaceState = function (state, title, url) {
      if (url) startProgress(String(url))
      return origReplace(state, title, url)
    }

    // Browser back / forward buttons
    const handlePopState = () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current)
      NProgress.start()
      safetyTimer.current = setTimeout(() => NProgress.done(), 10_000)
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      history.pushState = origPush
      history.replaceState = origReplace
      if (safetyTimer.current) clearTimeout(safetyTimer.current)
    }
  }, [])

  // ── Complete the bar when the new route actually mounts ──────────────────
  useEffect(() => {
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current)
      safetyTimer.current = null
    }
    NProgress.done()
  }, [pathname, searchParams])

  return null
}
