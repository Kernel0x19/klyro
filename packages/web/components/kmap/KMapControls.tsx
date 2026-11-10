'use client'
import { useKMapStore } from '@/stores/useKMapStore'
import { RotateCcw } from 'lucide-react'

export default function KMapControls() {
  const { variables, setVariables, variableNames, setVariableName, reset } = useKMapStore()

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border-theme shrink-0 bg-surface flex-wrap">
      {/* Variable count selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Variables</span>
        <div className="flex gap-1">
          {([2, 3, 4] as const).map((n) => (
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
            <input
              key={i}
              value={name}
              onChange={(e) => setVariableName(i, e.target.value)}
              maxLength={2}
              className="w-9 h-7 text-center text-sm font-mono font-bold bg-surface border border-border-theme rounded focus:border-[#4F6EF7] outline-none text-text-primary transition-colors"
            />
          ))}
        </div>
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

