'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Laptop,
  Cpu,
  Layers,
  Activity,
  Share2,
  Copy,
  Check,
  Search,
  Sun,
  Moon,
} from 'lucide-react'
import { APP_VERSION } from '@/lib/version'
import { IC_LIBRARY } from '@/lib/icLibrary'
import { useTheme } from '@/components/hooks/useTheme'

interface MobileDeviceNoticeProps {
  children?: React.ReactNode
}

export default function MobileDeviceNotice({ children }: MobileDeviceNoticeProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIcPart, setSelectedIcPart] = useState<string>('74LS08')
  const { theme, toggleTheme } = useTheme()

  // Check if previously dismissed in this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('klyro_mobile_dismissed') === 'true'
      setIsDismissed(dismissed)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('klyro_mobile_dismissed', 'true')
    }
  }

  const handleReopen = () => {
    setIsDismissed(false)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('klyro_mobile_dismissed')
    }
  }

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        const input = document.createElement('input')
        input.value = window.location.href
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    }
  }

  const allIcs = IC_LIBRARY.flatMap((cat) => cat.ics)
  const filteredIcs = searchQuery.trim()
    ? allIcs.filter(
        (ic) =>
          ic.part.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ic.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allIcs

  const currentIc = allIcs.find((ic) => ic.part === selectedIcPart) || allIcs[0]

  return (
    <>
      {/* 
        On Desktop (>= 1024px / lg): 
        The mobile notice is hidden completely via `lg:hidden`.
        Children are always visible via `lg:block`.

        On Mobile (< 1024px):
        - When !isDismissed: Mobile notice is rendered, and desktop children are hidden (preventing any desktop width from leaking into the mobile document).
        - When isDismissed: Desktop preview is shown, with a floating pill to re-open the mobile notice.
      */}
      {!isDismissed ? (
        <div className="block lg:hidden w-full min-h-screen bg-bg text-text-primary select-none flex flex-col font-sans relative overflow-x-hidden">
          
          {/* Subtle Grid Background with Radial Vignette — Exact same as Homepage Hero */}
          <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `
                linear-gradient(var(--grid-line) 1px, transparent 1px),
                linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              maskImage:
                'radial-gradient(ellipse at center, black 40%, transparent 85%)',
              WebkitMaskImage:
                'radial-gradient(ellipse at center, black 40%, transparent 85%)',
            }}
          />

          {/* Top Navbar — Matches Klyro Desktop Navbar */}
          <header className="relative z-10 w-full px-4 py-3 flex items-center justify-between border-b border-border-theme bg-bg/85 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Image
                src="/favicon.svg"
                alt="Klyro Logo"
                width={36}
                height={36}
                unoptimized
                className="aspect-square"
              />
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight">Klyro</span>
                <span className="text-xs font-extrabold text-label-gray">{APP_VERSION}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-2 bg-surface border border-border-theme text-text-primary hover:border-label transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* GitHub Link */}
              <button
                type="button"
                onClick={() =>
                  window.open('https://github.com/Kernel0x19/klyro', '_blank')
                }
                className="text-white flex items-center justify-center p-2 bg-[#343a40] hover:bg-[#1a1d27] transition-all cursor-pointer"
              >
                <Image
                  src="/github-logo.svg"
                  alt="GitHub"
                  width={18}
                  height={18}
                  className="aspect-square"
                />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10 flex-1 w-full max-w-full px-4 sm:px-6 py-8 flex flex-col items-center gap-10">
            
            {/* Hero Section — Matches Homepage Typography */}
            <div className="w-full flex flex-col items-center gap-4 text-center">
              
              {/* Badge */}
              <div className="px-3.5 py-1 bg-label w-fit cursor-default">
                <span className="text-xs sm:text-sm font-bold tracking-widest text-white uppercase">
                  Mobile Access · Coming Soon
                </span>
              </div>

              {/* Gradient Headline */}
              <h1 className="text-3xl sm:text-5xl font-bold bg-linear-to-r from-[#8BA4FA] via-[#4F6EF7] to-[#1E3AC2] bg-clip-text text-transparent tracking-wide leading-tight break-words">
                Build. Wire. Simulate.
              </h1>

              {/* Sub-headline */}
              <h2 className="text-base sm:text-xl font-bold leading-snug max-w-lg text-text-primary">
                The open-source lab bench for digital logic — designed for desktop and laptop computers.
              </h2>

              {/* Desktop Advisory Card */}
              <div className="w-full max-w-md mt-2 p-5 rounded-xl bg-surface border-2 border-border-theme flex flex-col items-center gap-3 text-center shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-label/15 border-2 border-label flex items-center justify-center text-label">
                  <Laptop size={24} />
                </div>

                <h3 className="text-xl font-bold text-label tracking-wide">
                  Desktop or Laptop Recommended
                </h3>

                <p className="text-xs sm:text-sm text-para leading-relaxed">
                  Klyro is a high-precision digital electronics lab bench. Placing 20-pin DIP ICs, precision Manhattan breadboard wiring, and real-time waveform timing analysis require the keyboard shortcuts, mouse accuracy, and screen space of a desktop or laptop.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 w-full pt-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full text-white flex items-center justify-center px-4 py-3 bg-get-started text-sm sm:text-base font-bold gap-2 transition-all duration-300 hover:bg-get-started-hover hover:rounded-xl cursor-pointer"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Link Copied to Clipboard!' : 'Copy Link to Open on Laptop'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full text-white flex items-center justify-center px-4 py-2.5 bg-black border-2 border-label text-xs sm:text-sm font-bold gap-2 transition-all duration-300 hover:rounded-xl cursor-pointer"
                  >
                    Continue to Preview Anyway
                    <Image
                      src="/diagonal-arrow.svg"
                      alt="Arrow"
                      width={14}
                      height={14}
                      className="aspect-square"
                    />
                  </button>
                </div>

                <p className="text-xs font-bold text-label-gray pt-1">
                  Also available as a Windows{' '}
                  <span className="underline cursor-pointer">Desktop App.</span>
                </p>
              </div>
            </div>

            {/* Upcoming Features Section — Styled exactly like FeaturesSection */}
            <section className="w-full max-w-md flex flex-col items-center gap-4">
              <div className="text-center flex flex-col gap-1">
                <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#8BA4FA] to-[#1E3AC2] bg-clip-text text-transparent tracking-wide">
                  What&apos;s Coming in Mobile Access
                </h2>
                <p className="text-label-gray text-xs sm:text-sm font-bold tracking-wider">
                  Features in active development for the Klyro Pocket Companion:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                {/* Feature 1 */}
                <div className="group flex flex-col gap-2.5 p-5 rounded-xl bg-surface border-2 border-border-theme hover:border-label transition-colors duration-300 text-left">
                  <div className="flex items-center justify-between">
                    <Cpu size={28} className="text-label" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Hardware Lab
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-label tracking-wide">
                    Pocket IC Companion
                  </h3>
                  <p className="text-xs sm:text-sm text-para leading-relaxed">
                    Instant pinouts, gate layouts, and truth tables for all 31 TTL ICs on your phone while breadboarding in your college or electronics lab.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="group flex flex-col gap-2.5 p-5 rounded-xl bg-surface border-2 border-border-theme hover:border-label transition-colors duration-300 text-left">
                  <div className="flex items-center justify-between">
                    <Layers size={28} className="text-label" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-label/15 text-label border border-label/25">
                      Read-Only
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-label tracking-wide">
                    Circuit Viewer & Snapshots
                  </h3>
                  <p className="text-xs sm:text-sm text-para leading-relaxed">
                    Pinch-to-zoom into saved circuits, inspect component assignments, and verify wire paths without risking accidental edits.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="group flex flex-col gap-2.5 p-5 rounded-xl bg-surface border-2 border-border-theme hover:border-label transition-colors duration-300 text-left">
                  <div className="flex items-center justify-between">
                    <Activity size={28} className="text-label" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                      Analysis
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-label tracking-wide">
                    Timing & Waveform Inspector
                  </h3>
                  <p className="text-xs sm:text-sm text-para leading-relaxed">
                    Review multi-channel digital signal waveforms, clock frequency transitions, and timing histories recorded during desktop runs.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="group flex flex-col gap-2.5 p-5 rounded-xl bg-surface border-2 border-border-theme hover:border-label transition-colors duration-300 text-left">
                  <div className="flex items-center justify-between">
                    <Share2 size={28} className="text-label" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25">
                      Cloud Sync
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-label tracking-wide">
                    One-Tap Desktop Hand-Off
                  </h3>
                  <p className="text-xs sm:text-sm text-para leading-relaxed">
                    Send your circuit project link directly to your laptop or email to pick up right where you left off.
                  </p>
                </div>
              </div>
            </section>

            {/* Interactive Pocket IC Quick Lookup */}
            <section className="w-full max-w-md p-5 rounded-xl bg-surface border-2 border-border-theme flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-label tracking-wide flex items-center gap-2">
                    <Cpu size={18} />
                    Try Early: Pocket IC Reference
                  </h3>
                  <p className="text-xs text-para">
                    Look up pinouts for 31 TTL chips directly on your phone
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-3 text-label-gray" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search IC (e.g. 74LS08, 74LS00, 74LS86)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-bg border border-border-theme rounded-lg text-text-primary placeholder:text-label-gray outline-none focus:border-label transition-colors"
                />
              </div>

              {/* Horizontal Chip Selectors */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 w-full scrollbar-none">
                {filteredIcs.slice(0, 10).map((ic) => (
                  <button
                    key={ic.part}
                    type="button"
                    onClick={() => setSelectedIcPart(ic.part)}
                    className={`px-3 py-1 text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      selectedIcPart === ic.part
                        ? 'bg-label text-white'
                        : 'bg-surface border border-border-theme text-label-gray hover:text-text-primary'
                    }`}
                  >
                    {ic.part}
                  </button>
                ))}
              </div>

              {/* Chip Details Card */}
              {currentIc && (
                <div className="p-3.5 rounded-lg bg-bg border border-border-theme flex flex-col gap-2 w-full">
                  <div className="flex items-baseline justify-between border-b border-border-theme pb-2">
                    <div>
                      <span className="text-sm font-extrabold text-label">
                        {currentIc.part}
                      </span>
                      <span className="text-xs text-text-primary ml-2 font-medium">
                        {currentIc.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border-theme text-text-secondary">
                      {currentIc.packageType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono pt-1">
                    {currentIc.pins.map((pin) => (
                      <div
                        key={pin.number}
                        className="flex items-center justify-between py-0.5 border-b border-border-theme/40"
                      >
                        <span className="text-label-gray font-bold">
                          Pin {pin.number}
                        </span>
                        <span
                          className={`font-semibold ${
                            pin.function === 'vcc'
                              ? 'text-red-500'
                              : pin.function === 'gnd'
                              ? 'text-blue-500'
                              : pin.function === 'output'
                              ? 'text-emerald-500'
                              : 'text-text-primary'
                          }`}
                        >
                          {pin.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* Footer — Matches Homepage Footer */}
          <footer className="relative z-10 w-full border-t-2 border-border-theme bg-bg py-6 px-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Image
                  src="/favicon.svg"
                  alt="Klyro Logo"
                  width={24}
                  height={24}
                  unoptimized
                  className="aspect-square"
                />
                <span className="font-extrabold text-base">Klyro</span>
                <span className="text-xs font-extrabold text-label-gray">{APP_VERSION}</span>
              </div>
              <p className="text-xs text-text-secondary">
                The open-source lab bench for digital logic · Designed for desktop & laptop displays.
              </p>
            </div>
          </footer>
        </div>
      ) : (
        /* Floating banner trigger when dismissed so user can re-open anytime on mobile */
        <aside
          aria-label="Desktop experience notice"
          className="fixed bottom-4 left-4 z-50 lg:hidden"
        >
          <button
            type="button"
            onClick={handleReopen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border-2 border-border-theme text-label text-xs font-bold shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <Laptop size={14} />
            <span>Desktop Recommended</span>
          </button>
        </aside>
      )}

      {/* 
        Desktop / Preview Content:
        - On Desktop (>= 1024px / lg): ALWAYS visible (block).
        - On Mobile (< 1024px): hidden when !isDismissed so desktop layout never forces horizontal scroll on mobile.
      */}
      <div className={isDismissed ? 'w-full' : 'w-full hidden lg:block'}>
        {children}
      </div>
    </>
  )
}
