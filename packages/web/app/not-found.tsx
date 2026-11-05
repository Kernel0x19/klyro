'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/hooks/useTheme'

export default function NotFound() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between select-none overflow-hidden">
      {/* ── Background Grid Pattern ── */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* ── Top Navbar ── */}
      <header className="w-full flex items-center justify-between px-6 sm:px-12 py-6 z-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 p-1 cursor-pointer select-none"
        >
          <Image
            src="/favicon.svg"
            alt="Klyro-Logo"
            width={80}
            height={80}
            className="aspect-square"
          />
          <div className="flex gap-1.5 items-baseline">
            <h1 className="text-5xl font-extrabold">Klyro</h1>
            <h1 className="text-sm font-extrabold">v0.1.0</h1>
          </div>
        </Link>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-white flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 dark:bg-[#343a40] text-sm font-bold transition-all hover:bg-neutral-700 dark:hover:bg-[#1a1d27] cursor-pointer"
        >
          {mounted ? (
            theme === 'dark' ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )
          ) : (
            <Sun size={18} />
          )}
        </button>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto w-full">
        {/* Large 404 number */}
        <h1 className="text-8xl sm:text-9xl font-black bg-linear-to-r from-[#8BA4FA] via-[#4F6EF7] to-[#1E3AC2] bg-clip-text text-transparent tracking-tight leading-none mb-4 select-none">
          404
        </h1>

        {/* Page Not Found title */}
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
          Page Not Found
        </h2>

        {/* Clean techy line */}
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-lg leading-relaxed">
          Looks like this wire leads nowhere — the logic state is floating and
          the requested route does not exist.
        </p>

        {/* ── Two Actions ── */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Go Back option */}
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-neutral-200 dark:bg-black/60 border-2 border-neutral-300 dark:border-[#4F6EF7] text-neutral-900 dark:text-white font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#4F6EF7]" />
            Go Back
          </button>

          {/* Home Page option */}
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-get-started hover:bg-get-started-hover text-white font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:rounded-xl cursor-pointer"
          >
            Home Page
            <Image
              src="/diagonal-arrow.svg"
              alt="Arrow"
              width={14}
              height={14}
              className="aspect-square filter brightness-0 invert"
            />
          </Link>
        </div>
      </main>

      {/* ── Subtle bottom spacing ── */}
      <div className="py-6" />
    </div>
  )
}
