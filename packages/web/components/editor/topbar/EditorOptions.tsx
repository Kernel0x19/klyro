'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  FolderDown,
  Save,
  Settings,
  Sun,
  Moon,
  LogOut,
  User,
  Loader2,
  Check,
  Keyboard,
  X,
  Grid3X3,
} from 'lucide-react'
import { useTheme } from '@/components/hooks/useTheme'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from '@/lib/supabase/auth'
import { useBoardStore } from '@/stores/useBoardStore'
import { saveBoardState } from '@/lib/circuitService'
import { serializeBoardState } from '@/lib/boardStateSerializer'
import { useEditorEdgesStore } from '@/stores/useEditorEdgesStore'
import { toPng } from 'html-to-image'

interface EditorActionsProps {
  avatarUrl: string | null
  name: string
  projectId: string
  userId: string
}

const SHORTCUTS = [
  { key: 'V', desc: 'Select tool' },
  { key: 'W', desc: 'Wire tool' },
  { key: 'H', desc: 'Pan tool' },
  { key: 'D', desc: 'Delete tool' },
  { key: 'Ctrl + S', desc: 'Save project' },
  { key: 'Ctrl + Z', desc: 'Undo (last wire)' },
  { key: 'Ctrl + Y', desc: 'Redo' },
  { key: 'Ctrl + Shift + Z', desc: 'Redo (alternative)' },
  { key: 'Del / Backspace', desc: 'Delete selected wire' },
  { key: 'Esc', desc: 'Deselect all' },
  { key: 'Space', desc: 'Toggle power' },
  { key: 'Scroll', desc: 'Zoom in/out' },
]

export default function EditorActions({
  avatarUrl,
  name,
  projectId,
  userId,
}: EditorActionsProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const profileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { icSlots, inputStates, isPowerOn, resetBoard, togglePower, isDirty, setDirty, showGrid, toggleShowGrid } =
    useBoardStore()
  const { edges } = useEditorEdgesStore()
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  // ── Save handler ────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (saveState === 'saving') return
    setSaveState('saving')
    const boardState = serializeBoardState(icSlots, edges, inputStates, isPowerOn)
    const { error } = await saveBoardState(projectId, userId, boardState)
    if (!error) {
      setSaveState('saved')
      setDirty(false)
      setTimeout(() => setSaveState('idle'), 2000)
    } else {
      setSaveState('idle')
    }
  }, [saveState, icSlots, edges, inputStates, isPowerOn, projectId, userId, setDirty])

  // ── Auto-save (debounced 30s when dirty) ────────────────────────────────
  useEffect(() => {
    if (!isDirty || !userId) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      handleSave()
    }, 30_000)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [isDirty, icSlots, edges, handleSave, userId])

  // Mark edges dirty when they change (wire drawn/deleted)
  useEffect(() => {
    if (edges.length > 0) setDirty(true)
  }, [edges, setDirty])

  // ── Ctrl+S shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === ' ') {
        const activeEl = document.activeElement
        const isInputFocused =
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement ||
          activeEl?.getAttribute('contenteditable') === 'true'
        if (!isInputFocused) {
          e.preventDefault()
          togglePower()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, togglePower])

  // ── Export as PNG ───────────────────────────────────────────────────────
  async function handleExportPng() {
    setExportOpen(false)
    const canvas = document.querySelector('.react-flow__renderer') as HTMLElement | null
    if (!canvas) return
    try {
      const dataUrl = await toPng(canvas, {
        backgroundColor: 'var(--background)',
        pixelRatio: 2,
        filter: (node) => {
          // Exclude controls and panels from screenshot
          if (node.classList?.contains('react-flow__controls')) return false
          if (node.classList?.contains('react-flow__panel')) return false
          return true
        },
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `klyro-circuit-${projectId}.png`
      a.click()
    } catch (err) {
      console.error('PNG export failed:', err)
    }
  }

  // ── Dropdown helpers ────────────────────────────────────────────────────
  function openDropdown() { if (closeTimer.current) clearTimeout(closeTimer.current); setExportOpen(true) }
  function closeDropdown() { closeTimer.current = setTimeout(() => setExportOpen(false), 100) }
  function openSettings() { if (settingsTimer.current) clearTimeout(settingsTimer.current); setSettingsOpen(true) }
  function closeSettings() { settingsTimer.current = setTimeout(() => setSettingsOpen(false), 100) }
  function openProfile() { if (profileTimer.current) clearTimeout(profileTimer.current); setProfileOpen(true) }
  function closeProfile() { profileTimer.current = setTimeout(() => setProfileOpen(false), 100) }

  return (
    <div className="h-full flex items-center justify-center gap-6 py-4">
      {/* Power / Play toggle */}
      <button
        type="button"
        onClick={togglePower}
        title={isPowerOn ? 'Power Off (Space)' : 'Power On (Space)'}
        className="cursor-pointer hover:text-label transition-colors duration-200"
      >
        {isPowerOn
          ? <Pause size={20} className="text-green-400 hover:text-green-300" />
          : <Play size={20} className="text-neutral-400 hover:text-green-400" />
        }
      </button>

      {/* Export dropdown */}
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
              <button
                onClick={handleExportPng}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-neutral-800 dark:text-white hover:bg-[#4F6EF7]/10 hover:text-[#4F6EF7] transition-colors duration-150 cursor-pointer"
              >
                Export as PNG
              </button>
              {[
                { label: 'Export as SVG', disabled: true },
                { label: 'Export as PDF', disabled: true },
                { label: 'Export as VHDL', disabled: true },
                { label: 'Export as Verilog', disabled: true },
              ].map((item) => (
                <button
                  key={item.label}
                  disabled={item.disabled}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                >
                  {item.label}
                  <span className="ml-1 text-[10px] text-neutral-400">(soon)</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save with dirty indicator */}
      <div className="relative">
        <button
          type="button"
          onClick={handleSave}
          title="Save (Ctrl+S)"
          className="flex items-center justify-center cursor-pointer"
        >
          <Save
            size={20}
            className={`transition-colors duration-500 ${isDirty ? 'text-amber-400 hover:text-amber-300' : 'hover:text-label'}`}
          />
        </button>
        {isDirty && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full pointer-events-none" />
        )}
      </div>

      {/* Reset board */}
      <button
        type="button"
        onClick={resetBoard}
        title="Reset Board — clears all ICs, wires, and inputs"
        className="cursor-pointer hover:text-red-400 text-neutral-400 dark:text-neutral-300 transition-colors duration-200 active:scale-90 flex items-center justify-center"
      >
        <RotateCcw size={20} />
      </button>

      <div className="w-0.5 h-10 bg-neutral-600" />

      {/* Settings dropdown */}
      <div className="relative">
        <Settings
          className="cursor-pointer hover:text-label transition-colors duration-200"
          onMouseEnter={openSettings}
          onMouseLeave={closeSettings}
        />
        {settingsOpen && (
          <div
            className="absolute top-full right-0 pt-2 z-50"
            onMouseEnter={openSettings}
            onMouseLeave={closeSettings}
          >
            <div className="w-56 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700/60 rounded-lg overflow-hidden shadow-lg">
              {/* Theme */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700/60">
                <span className="text-sm font-medium text-neutral-800 dark:text-white">Theme</span>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700/60 rounded-md text-xs font-medium text-neutral-800 dark:text-white transition-colors duration-150 cursor-pointer"
                >
                  {theme === 'dark' ? <><Sun size={12} /> Light</> : <><Moon size={12} /> Dark</>}
                </button>
              </div>

              {/* Show Grid */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700/60">
                <span className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-white">
                  <Grid3X3 size={13} />
                  Show Grid
                </span>
                <button
                  onClick={toggleShowGrid}
                  role="switch"
                  aria-checked={showGrid}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${showGrid ? 'bg-[#4F6EF7]' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${showGrid ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => { setSettingsOpen(false); setShortcutsOpen(true) }}
                className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-sm font-medium text-neutral-800 dark:text-white hover:bg-[#4F6EF7]/10 hover:text-[#4F6EF7] transition-colors duration-150 cursor-pointer"
              >
                <Keyboard size={13} />
                Keyboard Shortcuts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div className="relative">
        <div onMouseEnter={openProfile} onMouseLeave={closeProfile} className="cursor-pointer">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              width={32}
              height={32}
              unoptimized
              className="rounded-full hover:ring-2 hover:ring-[#4F6EF7] transition-all duration-200 object-cover"
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
          <div className="absolute top-full right-0 pt-2 z-50" onMouseEnter={openProfile} onMouseLeave={closeProfile}>
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

      {/* Save state toast */}
      {saveState !== 'idle' && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1a1a1a] border border-neutral-700/60 rounded-xl shadow-xl">
          {saveState === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#4F6EF7]" />
              <span className="text-sm font-medium text-neutral-300">Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-neutral-300">Saved</span>
            </>
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="relative w-full max-w-sm mx-4 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700/60 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Keyboard size={16} className="text-[#4F6EF7]" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                <X size={15} className="text-neutral-500" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {SHORTCUTS.map(({ key, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{desc}</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
