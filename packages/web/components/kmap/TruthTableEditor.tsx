'use client'
import { useKMapStore } from '@/stores/useKMapStore'

export default function TruthTableEditor() {
  const { variables, variableNames, cellValues, toggleCell } = useKMapStore()
  const numRows = 1 << variables
  const names = variableNames.slice(0, variables)

  return (
    <div className="w-64 border-r border-border-theme flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border-theme bg-surface shrink-0">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Truth Table
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr>
              <th className="px-2 py-1.5 text-left font-semibold text-text-secondary border-b border-border-theme w-7">
                #
              </th>
              {names.map((n) => (
                <th
                  key={n}
                  className="px-1 py-1.5 text-center font-mono font-bold text-text-primary border-b border-border-theme"
                >
                  {n}
                </th>
              ))}
              <th className="px-2 py-1.5 text-center font-semibold text-text-secondary border-b border-border-theme">
                Out
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numRows }, (_, i) => {
              const bits = Array.from(
                { length: variables },
                (_, j) => (i >> (variables - 1 - j)) & 1
              )
              const val = cellValues[i]
              return (
                <tr
                  key={i}
                  className="border-b border-border-theme/40 hover:bg-surface/60 transition-colors"
                >
                  <td className="px-2 py-1 text-text-secondary font-mono">{i}</td>
                  {bits.map((b, j) => (
                    <td key={j} className="px-1 py-1 text-center font-mono text-text-primary">
                      {b}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => toggleCell(i)}
                      className={`w-8 h-6 rounded text-xs font-bold font-mono transition-colors cursor-pointer ${
                        val === 1
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : val === 'X'
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                      }`}
                    >
                      {val === 'X' ? 'X' : String(val)}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

