'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'

NProgress.configure({
  minimum: 0.25,
  easing: 'ease-out',
  speed: 250,
  showSpinner: false,
  trickleSpeed: 200,
})

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 1. When route/searchParams changes, complete the progress bar
  useEffect(() => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
    }
    NProgress.done()
  }, [pathname, searchParams])

  // 2. Global click and popstate listeners for seamless navigation progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore if event was prevented or modified
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
        return
      }

      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const rawHref = anchor.getAttribute('href')
      if (!rawHref) return

      // Ignore anchor fragments, external links, protocols, or downloads
      if (
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return
      }

      // Check URL destination
      try {
        const targetUrl = new URL(anchor.href, window.location.href)
        const currentUrl = new URL(window.location.href)

        // Only handle same-origin navigation
        if (targetUrl.origin !== currentUrl.origin) {
          return
        }

        // Ignore clicks to the exact same page path and query
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return
        }

        // Start progress bar
        NProgress.start()

        // Safety fallback: if navigation is cancelled or takes unusually long, auto-done after 8s
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
        safetyTimeoutRef.current = setTimeout(() => {
          NProgress.done()
        }, 8000)
      } catch {
        // invalid URL, ignore
      }
    }

    const handlePopState = () => {
      NProgress.start()
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = setTimeout(() => {
        NProgress.done()
      }, 8000)
    }

    document.addEventListener('click', handleClick, { capture: true })
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
      window.removeEventListener('popstate', handlePopState)
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    }
  }, [])

  return null
}
