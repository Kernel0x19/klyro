'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/components/hooks/useTheme'
import { Sun, Moon, LogOut } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import { APP_VERSION } from '@/lib/version'
export default function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <div className="w-full h-25 flex items-center justify-between pl-4 pr-10 shrink-0 bg-bg text-text-primary">
      <Link
        href={'/'}
        className="flex items-center gap-2.5 p-3 cursor-pointer select-none"
      >
        <Image
          src="/favicon.svg"
          alt="Klyro-Logo"
          width={60}
          height={60}
          className="aspect-square"
        />
        <div className="flex gap-1.5 items-baseline">
          <h1 className="text-4xl font-extrabold">Klyro</h1>
          <h1 className="text-sm font-extrabold">{APP_VERSION}</h1>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-white flex items-center justify-center p-3 bg-[#343a40] text-base font-bold transition-all duration-500 hover:bg-[#1a1d27] hover:rounded-lg cursor-pointer"
        >
          {mounted ? (
            theme === 'dark' ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )
          ) : (
            <Sun size={20} />
          )}
        </button>
        <button
          onClick={() => signOut()}
          title="Log out"
          className="text-white flex items-center justify-center p-3 bg-red-500 text-base font-bold transition-all duration-500 hover:bg-red-600 hover:rounded-lg cursor-pointer"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  )
}
