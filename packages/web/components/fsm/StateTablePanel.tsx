'use client'
import React, { useState } from 'react'
import { useFSMStore } from '@/stores/useFSMStore'
import {
  exportStateTableToCSV,
  exportStateTableToLaTeX,
  exportStateTableToMarkdown,
} from '@/lib/fsm/fsmExporter'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  FileCode,
} from 'lucide-react'

export default function StateTablePanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const tableRows = useFSMStore((s) => s.tableRows)
  const equations = useFSMStore((s) => s.equations)
  const inputs = useFSMStore((s) => s.inputs)
  const outputs = useFSMStore((s) => s.outputs)
  const encoding = useFSMStore((s) => s.encoding)
  const setEncoding = useFSMStore((s) => s.setEncoding)

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1800)
  }

  function downloadCSV() {
    const csv = exportStateTableToCSV(tableRows, inputs, outputs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `klyro-fsm-state-table.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border-t border-border-theme bg-surface flex flex-col shrink-0 font-mono transition-all duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-theme bg-surface/90 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 font-bold text-text-primary hover:text-[#4F6EF7] transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span>State Transition Table & Logic Equations</span>
          </button>

          {/* Encoding selector */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span>Encoding:</span>
            <div className="flex gap-1">
              {(['binary', 'gray', 'one-hot'] as const).map((enc) => (
                <button
                  key={enc}
                  onClick={() => setEncoding(enc)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    encoding === enc
                      ? 'bg-[#4F6EF7] text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {enc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Export action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              copyText(
                'md',
                exportStateTableToMarkdown(tableRows, inputs, outputs)
              )
            }
            title="Copy as Markdown table"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
          >
            {copiedKey === 'md' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            Markdown
          </button>
          <button
            onClick={() =>
              copyText(
                'latex',
                exportStateTableToLaTeX(tableRows, inputs, outputs)
              )
            }
            title="Copy as LaTeX table"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
          >
            {copiedKey === 'latex' ? <Check size={12} className="text-green-400" /> : <FileCode size={12} />}
            LaTeX
          </button>
          <button
            onClick={downloadCSV}
            title="Download CSV"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
          >
            <Download size={12} />
            CSV
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!collapsed && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
          {/* Transition Table (takes 2 cols on lg) */}
          <div className="lg:col-span-2 overflow-x-auto border border-border-theme rounded bg-bg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border-theme bg-surface text-text-secondary font-bold">
                  <th className="px-3 py-1.5">Present State</th>
                  <th className="px-2 py-1.5 text-center">Code (Q)</th>
                  {inputs.map((inp) => (
                    <th key={inp} className="px-2 py-1.5 text-center text-[#4F6EF7]">
                      In ({inp})
                    </th>
                  ))}
                  <th className="px-3 py-1.5">Next State</th>
                  <th className="px-2 py-1.5 text-center">Code (D)</th>
                  {outputs.map((out) => (
                    <th key={out} className="px-2 py-1.5 text-center text-green-400">
                      Out ({out})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 text-text-primary">
                {tableRows.length > 0 ? (
                  tableRows.map((r) => (
                    <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-3 py-1 font-bold">{r.presentStateName}</td>
                      <td className="px-2 py-1 text-center text-text-secondary">{r.presentStateCode}</td>
                      {inputs.map((inp) => (
                        <td key={inp} className="px-2 py-1 text-center font-bold text-[#4F6EF7]">
                          {r.inputs[inp] ?? 0}
                        </td>
                      ))}
                      <td className="px-3 py-1 font-bold">{r.nextStateName}</td>
                      <td className="px-2 py-1 text-center text-text-secondary">{r.nextStateCode}</td>
                      {outputs.map((out) => (
                        <td
                          key={out}
                          className={`px-2 py-1 text-center font-bold ${
                            r.outputs[out] === 1 ? 'text-green-400' : 'text-neutral-500'
                          }`}
                        >
                          {r.outputs[out] ?? 0}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4 + inputs.length + outputs.length} className="px-4 py-3 text-center text-neutral-500 italic">
                      No states or transitions defined.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Logic Equations Panel (takes 1 col) */}
          <div className="border border-border-theme rounded bg-bg p-3 flex flex-col gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Minimized Logic Equations (SOP)
            </span>
            {equations.length > 0 ? (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-48">
                {equations.map((eq) => (
                  <div
                    key={eq.variable}
                    className="flex items-center justify-between p-2 rounded bg-surface border border-border-theme"
                  >
                    <div className="flex items-baseline gap-2 overflow-hidden">
                      <span className="font-bold text-[#4F6EF7] text-xs shrink-0">
                        {eq.variable} =
                      </span>
                      <span className="font-mono text-xs text-text-primary truncate">
                        {eq.sop}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        copyText(eq.variable, `${eq.variable} = ${eq.sop}`)
                      }
                      title="Copy equation"
                      className="text-neutral-400 hover:text-text-primary p-1 rounded hover:bg-neutral-800 transition-colors shrink-0"
                    >
                      {copiedKey === eq.variable ? (
                        <Check size={12} className="text-green-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-neutral-500 italic">
                Add states and transitions to compute equations.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
