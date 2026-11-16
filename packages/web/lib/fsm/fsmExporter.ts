import type { StateTableRow } from './types'

export function exportStateTableToMarkdown(
  rows: StateTableRow[],
  inputNames: string[],
  outputNames: string[]
): string {
  if (rows.length === 0) return 'No states defined.'

  const headers = [
    'Present State',
    'Present Code',
    ...inputNames.map((inp) => `Input (${inp})`),
    'Next State',
    'Next Code',
    ...outputNames.map((out) => `Output (${out})`),
  ]

  const headerRow = `| ${headers.join(' | ')} |`
  const dividerRow = `| ${headers.map(() => '---').join(' | ')} |`

  const dataRows = rows.map((r) => {
    const cols = [
      r.presentStateName,
      `\`${r.presentStateCode}\``,
      ...inputNames.map((inp) => String(r.inputs[inp] ?? 0)),
      r.nextStateName,
      `\`${r.nextStateCode}\``,
      ...outputNames.map((out) => String(r.outputs[out] ?? 0)),
    ]
    return `| ${cols.join(' | ')} |`
  })

  return [headerRow, dividerRow, ...dataRows].join('\n')
}

export function exportStateTableToCSV(
  rows: StateTableRow[],
  inputNames: string[],
  outputNames: string[]
): string {
  const headers = [
    'Present State',
    'Present Code',
    ...inputNames,
    'Next State',
    'Next Code',
    ...outputNames,
  ]

  const lines = [headers.join(',')]

  rows.forEach((r) => {
    const cols = [
      `"${r.presentStateName}"`,
      `"${r.presentStateCode}"`,
      ...inputNames.map((inp) => String(r.inputs[inp] ?? 0)),
      `"${r.nextStateName}"`,
      `"${r.nextStateCode}"`,
      ...outputNames.map((out) => String(r.outputs[out] ?? 0)),
    ]
    lines.push(cols.join(','))
  })

  return lines.join('\n')
}

export function exportStateTableToLaTeX(
  rows: StateTableRow[],
  inputNames: string[],
  outputNames: string[]
): string {
  const colCount = 4 + inputNames.length + outputNames.length
  const colAlign = '|c'.repeat(colCount) + '|'

  const headers = [
    'Present State',
    'Code ($Q$)',
    ...inputNames.map((inp) => `In ($${inp}$)`),
    'Next State',
    'Code ($D$)',
    ...outputNames.map((out) => `Out ($${out}$)`),
  ]

  const lines: string[] = [
    `\\begin{table}[htbp]`,
    `\\centering`,
    `\\begin{tabular}{${colAlign}}`,
    `\\hline`,
    `${headers.join(' & ')} \\\\ \\hline`,
  ]

  rows.forEach((r) => {
    const cols = [
      r.presentStateName,
      r.presentStateCode,
      ...inputNames.map((inp) => String(r.inputs[inp] ?? 0)),
      r.nextStateName,
      r.nextStateCode,
      ...outputNames.map((out) => String(r.outputs[out] ?? 0)),
    ]
    lines.push(`${cols.join(' & ')} \\\\`)
  })

  lines.push(`\\hline`)
  lines.push(`\\end{tabular}`)
  lines.push(`\\caption{FSM State Transition Table}`)
  lines.push(`\\end{table}`)

  return lines.join('\n')
}
