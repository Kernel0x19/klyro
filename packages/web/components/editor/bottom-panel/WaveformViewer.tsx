'use client'
import { useRef, useEffect } from 'react'
import { useBoardStore } from '@/stores/useBoardStore'
import { useTheme } from '@/components/hooks/useTheme'
const TRACK_HEIGHT = 28
const LABEL_WIDTH = 110
const SAMPLE_WIDTH = 22
function sortSignals(a: string, b: string): number {
  const getCategory = (s: string) => {
    if (s.startsWith('IN-')) return 1
    if (s.startsWith('CLK-')) return 2
    if (s.startsWith('OUT-')) return 3
    return 4
  }
  const catA = getCategory(a)
  const catB = getCategory(b)
  if (catA !== catB) return catA - catB
  const numA = parseFloat(a.split('-')[1] ?? '0')
  const numB = parseFloat(b.split('-')[1] ?? '0')
  return numA - numB
}
function buildPaths(samples: boolean[], totalSamples: number) {
  const high = 5
  const low = 23
  let strokePath = ''
  let fillPath = `M 0 ${low}`
  let prev: boolean | null = null
  const paddedSamples =
    samples.length < totalSamples
      ? [...Array(totalSamples - samples.length).fill(false), ...samples]
      : samples
  for (let i = 0; i < paddedSamples.length; i++) {
    const x = i * SAMPLE_WIDTH
    const xNext = (i + 1) * SAMPLE_WIDTH
    const val = paddedSamples[i]
    const y = val ? high : low
    if (prev === null) {
      strokePath += `M ${x} ${y}`
    } else if (val !== prev) {
      strokePath += ` L ${x} ${prev ? high : low} L ${x} ${y}`
    }
    strokePath += ` L ${xNext} ${y}`
    fillPath += ` L ${x} ${y} L ${xNext} ${y}`
    prev = val
  }
  const totalWidth = paddedSamples.length * SAMPLE_WIDTH
  fillPath += ` L ${totalWidth} ${low} Z`
  return { strokePath, fillPath, paddedSamples }
}
export default function WaveformViewer() {
  const { waveformHistory } = useBoardStore()
  const { theme } = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isDark = theme === 'dark'
  const textColor = 'var(--text-secondary)'
  const borderColor = 'var(--border)'
  const surfaceElevated = 'var(--surface-elevated)'
  const bgColor = 'var(--surface)'
  const entries = Object.entries(waveformHistory).filter(
    ([, samples]) => samples.length > 0
  )
  const sortedEntries = entries.sort(([a], [b]) => sortSignals(a, b))
  const maxSamples = sortedEntries.reduce(
    (max, [, s]) => Math.max(max, s.length),
    0
  )
  const totalWidth = Math.max(maxSamples * SAMPLE_WIDTH, 400)
  useEffect(() => {
    if (scrollContainerRef.current && maxSamples > 0) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth
    }
  }, [maxSamples])
  if (entries.length === 0) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 select-none"
        style={{ color: textColor, background: bgColor }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-40"
        >
          <path d="M2 12h3l3-8 4 16 3-12 3 8 3-4h3" />
        </svg>
        <span className="text-[12px] font-semibold opacity-80">
          No Waveforms Recorded
        </span>
        <span className="text-[11px] opacity-60">
          Toggle input switches or clock to record digital waveform transitions
        </span>
      </div>
    )
  }
  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full overflow-auto select-none"
      style={{ background: bgColor }}
    >
      <div style={{ minWidth: LABEL_WIDTH + totalWidth }}>
        { }
        <div
          className="sticky top-0 z-20 flex items-center border-b"
          style={{
            height: 24,
            background: surfaceElevated,
            borderColor,
          }}
        >
          { }
          <div
            className="sticky left-0 z-30 shrink-0 px-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between"
            style={{
              width: LABEL_WIDTH,
              height: 24,
              background: surfaceElevated,
              color: textColor,
              borderRight: `1px solid ${borderColor}`,
            }}
          >
            <span>Signal</span>
            <span className="text-[9px] opacity-75">Val</span>
          </div>
          { }
          <div
            className="relative h-full flex items-center"
            style={{ width: totalWidth }}
          >
            {Array.from({ length: maxSamples }).map((_, idx) => (
              <div
                key={idx}
                className="absolute flex flex-col items-center justify-end h-full"
                style={{
                  left: idx * SAMPLE_WIDTH,
                  width: SAMPLE_WIDTH,
                }}
              >
                {idx % 5 === 0 && (
                  <span
                    className="text-[9px] font-mono leading-none mb-1 opacity-70"
                    style={{ color: textColor }}
                  >
                    T{idx}
                  </span>
                )}
                <div
                  className="w-px"
                  style={{
                    height: idx % 5 === 0 ? 6 : 3,
                    background: idx % 5 === 0 ? textColor : borderColor,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        { }
        <div className="flex flex-col py-1">
          {sortedEntries.map(([label, samples]) => {
            const { strokePath, fillPath, paddedSamples } = buildPaths(
              samples,
              maxSamples
            )
            const currentVal = paddedSamples[paddedSamples.length - 1] ?? false
            return (
              <div
                key={label}
                className="flex items-center group hover:bg-sky-500/5 transition-colors"
                style={{ height: TRACK_HEIGHT }}
              >
                { }
                <div
                  className="sticky left-0 z-10 shrink-0 flex items-center justify-between px-2 text-[11px] font-mono font-bold"
                  style={{
                    width: LABEL_WIDTH,
                    height: TRACK_HEIGHT,
                    background: surfaceElevated,
                    color: textColor,
                    borderRight: `1px solid ${borderColor}`,
                  }}
                >
                  <span className="truncate">{label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${currentVal
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}
                  >
                    {currentVal ? '1' : '0'}
                  </span>
                </div>
                { }
                <div
                  className="relative shrink-0"
                  style={{ width: totalWidth, height: TRACK_HEIGHT }}
                >
                  <svg
                    width={totalWidth}
                    height={TRACK_HEIGHT}
                    className="absolute top-0 left-0 pointer-events-none"
                  >
                    { }
                    <line
                      x1={0}
                      y1={23}
                      x2={totalWidth}
                      y2={23}
                      stroke={isDark ? '#27272a' : '#e4e4e7'}
                      strokeWidth={1}
                    />
                    { }
                    <path d={fillPath} fill="rgba(34, 197, 94, 0.12)" />
                    { }
                    <path
                      d={strokePath}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth={1.75}
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
