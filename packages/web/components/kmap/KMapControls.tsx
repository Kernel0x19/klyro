'use client'
import { useState, useEffect } from 'react'
import { useKMapStore } from '@/stores/useKMapStore'
import { RotateCcw, ArrowDownToLine } from 'lucide-react'
import type { VarCount } from '@/stores/useKMapStore'

// ── Per-input draft state ──────────────────────────────────────────────────────
// The store snaps empty values back to defaults immediately, so we keep a
// local draft and only push to the store on blur / Enter.
interface VarNameInputProps {
  storeValue: string   // current value in the store
  index: number
  onCommit: (index: number, value: string) => void
}

function VarNameInput({ storeValue, index, onCommit }: VarNameInputProps) {
  const [draft, setDraft] = useState(storeValue)

  // Sync draft when store value changes from the outside (e.g. reset, variable count change)
  useEffect(() => {
    setDraft(storeValue)
  }, [storeValue])

  function commit() {
    const trimmed = draft.trim().slice(0, 2)
    if (trimmed) {
      onCommit(index, trimmed)
    } else {
      // If cleared entirely, revert to store value
      setDraft(storeValue)
    }
  }

  return (
    <input
      value={draft}
      maxLength={2}
      onChange={(e) => setDraft(e.target.value.toUpperCase())}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.currentTarget.blur() }
        if (e.key === 'Escape') { setDraft(storeValue); e.currentTarget.blur() }
      }}
      className="w-9 h-7 text-center text-sm font-mono font-bold bg-surface border border-border-theme rounded focus:border-[#4F6EF7] outline-none text-text-primary transition-colors"
    />
  )
}

// ── Main controls bar ──────────────────────────────────────────────────────────
export default function KMapControls() {
  const { variables, setVariables, variableNames, setVariableName, reset, loadFromSOP } = useKMapStore()
  const [sopInput, setSopInput] = useState('')

  function handleLoadSOP() {
    if (!sopInput.trim()) return
    loadFromSOP(sopInput.trim())
    setSopInput('')
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border-theme shrink-0 bg-surface flex-wrap">
      {/* Variable count selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Variables</span>
        <div className="flex gap-1">
          {([2, 3, 4, 5] as VarCount[]).map((n) => (
            <button
              key={n}
              onClick={() => setVariables(n)}
              className={`w-8 h-7 rounded text-sm font-bold transition-colors cursor-pointer ${
                variables === n
                  ? 'bg-[#4F6EF7] text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-border-theme" />

      {/* Variable name inputs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Names</span>
        <div className="flex gap-1.5">
          {variableNames.slice(0, variables).map((name, i) => (
            <VarNameInput
              key={i}
              storeValue={name}
              index={i}
              onCommit={setVariableName}
            />
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-border-theme" />

      {/* SOP → K-Map reverse sync */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide shrink-0">Load SOP</span>
        <input
          value={sopInput}
          onChange={(e) => setSopInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLoadSOP()}
          placeholder="e.g. A'B + BC'"
          className="h-7 px-2 text-xs font-mono bg-surface border border-border-theme rounded focus:border-[#4F6EF7] outline-none text-text-primary w-36 transition-colors placeholder:text-neutral-500"
        />
        <button
          onClick={handleLoadSOP}
          title="Fill K-Map from SOP"
          className="h-7 px-2 flex items-center gap-1 text-xs text-neutral-400 hover:text-[#4F6EF7] border border-border-theme rounded hover:border-[#4F6EF7] transition-colors cursor-pointer"
        >
          <ArrowDownToLine size={12} />
        </button>
      </div>

      <div className="ml-auto">
        <button
          onClick={reset}
          title="Reset K-Map"
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors px-2.5 py-1.5 rounded hover:bg-red-400/10 cursor-pointer"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>
    </div>
  )
}
