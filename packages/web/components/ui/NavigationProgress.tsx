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

function safeStart() {
  if (NProgress.isStarted()) return

  // If an old progress bar container is still in the DOM (e.g. fading out), reset it
  const existing = document.getElementById('nprogress')
  if (existing) {
    NProgress.remove()
  }

  NProgress.start()
}

function safeDone() {
  if (NProgress.isStarted()) {
    NProgress.done()
  }
}

/**
 * Handles application-wide navigation progress bar.
 *
 * 1. Listens for link clicks on same-origin paths to start the bar immediately when a user navigates.
 * 2. Patches history.pushState / history.replaceState to support programmatic navigation (router.push/replace).
 * 3. Does NOT hook 'popstate' — back/forward browser navigations are served instantly from client cache/bfcache
 *    and should never flash a loading bar.
 * 4. Completes the progress bar when the new route mounts via [pathname, searchParams].
 * 5. Includes an 8-second safety timeout so the bar never gets stuck on aborted or failing requests.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const patched = useRef(false)
  const isFirstRender = useRef(true)
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Setup click listener & history patch once on mount ───────────────────
  useEffect(() => {
    if (patched.current) return
    patched.current = true

    function startProgress() {
      if (safetyTimer.current) clearTimeout(safetyTimer.current)
      safeStart()

      // Safety timeout: auto-complete if navigation never resolves
      safetyTimer.current = setTimeout(() => {
        safeDone()
      }, 8000)
    }

    // 1. Capture click on internal links so the bar starts immediately upon click
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as Element | null)?.closest('a')
      if (!anchor) return

      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      if (anchor.getAttribute('rel')?.includes('external')) return

      const rawHref = anchor.getAttribute('href')
      if (!rawHref) return
      if (
        rawHref.startsWith('#') ||
        rawHref.startsWith('javascript:') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:')
      ) {
        return
      }

      try {
        const target = new URL(anchor.href, window.location.href)
        const current = new URL(window.location.href)

        // Only handle same-origin navigation
        if (target.origin !== current.origin) return

        // Ignore clicks to exact same page path and query (e.g. hash jumps)
        if (
          target.pathname === current.pathname &&
          target.search === current.search
        ) {
          return
        }

        startProgress()
      } catch {
        // Ignore invalid URLs
      }
    }

    // 2. Patch history.pushState (for router.push and redirects)
    const origPush = history.pushState.bind(history)
    history.pushState = function (state, title, url) {
      if (url) {
        try {
          const target = new URL(String(url), window.location.href)
          const current = new URL(window.location.href)
          if (
            target.origin === current.origin &&
            (target.pathname !== current.pathname ||
              target.search !== current.search)
          ) {
            startProgress()
          }
        } catch {
          // Ignore invalid URLs
        }
      }
      return origPush(state, title, url)
    }

    // 3. Patch history.replaceState (for redirects & router.replace)
    const origReplace = history.replaceState.bind(history)
    history.replaceState = function (state, title, url) {
      if (url) {
        try {
          const target = new URL(String(url), window.location.href)
          const current = new URL(window.location.href)
          if (
            target.origin === current.origin &&
            (target.pathname !== current.pathname ||
              target.search !== current.search)
          ) {
            startProgress()
          }
        } catch {
          // Ignore invalid URLs
        }
      }
      return origReplace(state, title, url)
    }

    document.addEventListener('click', handleClick, { capture: true })

    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
      history.pushState = origPush
      history.replaceState = origReplace
      if (safetyTimer.current) clearTimeout(safetyTimer.current)
    }
  }, [])

  // ── Complete the bar when the new route actually mounts ──────────────────
  useEffect(() => {
    // Skip completing on initial mount (nothing was loading)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current)
      safetyTimer.current = null
    }

    safeDone()
  }, [pathname, searchParams])

  return null
}
