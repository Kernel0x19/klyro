'use client'
import { useEffect } from 'react'
import NProgress from 'nprogress'
import { usePathname } from 'next/navigation'

export default function ProgressStarter() {
  const pathname = usePathname()

  useEffect(() => {
    NProgress.done()
  }, [pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http')) return
      NProgress.start()
    }

    const handleSubmit = () => NProgress.start()

    document.addEventListener('click', handleClick)
    document.addEventListener('submit', handleSubmit)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('submit', handleSubmit)
    }
  }, [])

  return null
}
