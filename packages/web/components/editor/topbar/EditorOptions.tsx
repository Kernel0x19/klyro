'use client'
import { useState, useRef } from 'react'
import {
  Play,
  FolderDown,
  Save,
  Settings,
  Sun,
  Moon,
  LogOut,
  User,
} from 'lucide-react'
import { useTheme } from '@/components/hooks/useTheme'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from '@/lib/supabase/auth'

interface EditorActionsProps {
  avatarUrl: string | null
  name: string
}

export default function EditorActions({ avatarUrl, name }: EditorActionsProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const profileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openDropdown() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setExportOpen(true)
  }

  function closeDropdown() {
    closeTimer.current = setTimeout(() => setExportOpen(false), 100)
  }
  function openSettings() {
    if (settingsTimer.current) clearTimeout(settingsTimer.current)
    setSettingsOpen(true)
  }
  function closeSettings() {
    settingsTimer.current = setTimeout(() => setSettingsOpen(false), 100)
  }

  function openProfile() {
    if (profileTimer.current) clearTimeout(profileTimer.current)
    setProfileOpen(true)
  }
  function closeProfile() {
    profileTimer.current = setTimeout(() => setProfileOpen(false), 100)
  }

  return (
    <div className="h-full flex items-center justify-center gap-6 py-4">
      <Play className="cursor-pointer hover:text-label transition-colors duration-500" />

      <div className="relative">
        <FolderDown
          className="cursor-pointer hover:text-label transition-colors duration-500"
          onMouseEnter={openDropdown}
          onMouseLeave={closeDropdown}
        />
        {exportOpen && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <div className="w-44 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700/60 rounded-lg overflow-hidden shadow-lg">
              {[
                { label: 'Export as VHDL', ext: 'vhdl' },
                { label: 'Export as Verilog', ext: 'svg' },
                { label: 'Export as PNG', ext: 'PNG' },
                { label: 'Export as PDF', ext: 'pdf' },
              ].map((item) => (
                <button
                  key={item.ext}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-neutral-800 dark:text-white hover:bg-[#4F6EF7]/10 hover:text-[#4F6EF7] transition-colors duration-150 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Save className="cursor-pointer hover:text-label transition-colors duration-500" />
      <div className="w-0.5 h-10 bg-neutral-600 hover:text-label transition-colors duration-500" />
      <div className="relative">
        <Settings
          className="cursor-pointer"
          onMouseEnter={openSettings}
          onMouseLeave={closeSettings}
        />
        {settingsOpen && (
          <div
            className="absolute top-full right-0 pt-2 z-50"
            onMouseEnter={openSettings}
            onMouseLeave={closeSettings}
          >
            <div className="w-52 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700/60 rounded-lg overflow-hidden shadow-lg">
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700/60">
                <span className="text-sm font-medium text-neutral-800 dark:text-white">
                  Theme
                </span>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700/60 rounded-md text-xs font-medium text-neutral-800 dark:text-white transition-colors duration-150 cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun size={12} />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon size={12} />
                      Dark
                    </>
                  )}
                </button>
              </div>
              {[
                { label: 'Grid Settings' },
                { label: 'Snap to Grid' },
                { label: 'Keyboard Shortcuts' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-neutral-800 dark:text-white hover:bg-[#4F6EF7]/10 hover:text-[#4F6EF7] transition-colors duration-150 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        <div
          onMouseEnter={openProfile}
          onMouseLeave={closeProfile}
          className="cursor-pointer"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full hover:ring-2 hover:ring-[#4F6EF7] transition-all duration-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#262626] border border-neutral-700 flex items-center justify-center hover:ring-2 hover:ring-[#4F6EF7] transition-all duration-200">
              <span className="text-xs font-bold text-neutral-400">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {profileOpen && (
          <div
            className="absolute top-full right-0 pt-2 z-50"
            onMouseEnter={openProfile}
            onMouseLeave={closeProfile}
          >
            <div className="w-44 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700/60 rounded-lg overflow-hidden shadow-lg">
              <Link
                href="/account"
                className="w-full px-4 py-2.5 flex items-center gap-2.5 text-sm font-medium text-neutral-800 dark:text-white hover:bg-[#4F6EF7]/10 hover:text-[#4F6EF7] transition-colors duration-150"
              >
                <User size={14} />
                Account
              </Link>
              <button
                onClick={() => signOut()}
                className="w-full px-4 py-2.5 flex items-center gap-2.5 text-sm font-medium text-neutral-800 dark:text-white hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150 cursor-pointer border-t border-neutral-200 dark:border-neutral-700/60"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
