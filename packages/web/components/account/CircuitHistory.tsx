import { ExternalLink, Trash2, Clock, Cpu } from 'lucide-react'

const moduleStyles: Record<string, { badge: string; icon: string }> = {
  logic: {
    badge: 'bg-[#26215C22] text-[#AFA9EC] border border-[#534AB755]',
    icon: 'text-[#7F77DD]',
  },
  analog: {
    badge: 'bg-[#04342C22] text-[#5DCAA5] border border-[#0F6E5655]',
    icon: 'text-[#1D9E75]',
  },
  mixed: {
    badge: 'bg-[#41240222] text-[#EF9F27] border border-[#854F0B55]',
    icon: 'text-[#BA7517]',
  },
  digital: {
    badge: 'bg-[#042C5322] text-[#85B7EB] border border-[#185FA555]',
    icon: 'text-[#378ADD]',
  },
}

type Circuit = { id: string; name: string; module: string; lastEdited: string }

interface CirHis {
  circuits?: Circuit[]
  onOpen?: (id: string) => void
  onDelete?: (id: string) => void
}

export function CircuitHistory({ circuits = [], onOpen, onDelete }: CirHis) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
          Circuit History
        </h2>
        <span className="text-neutral-500 font-bold bg-neutral-200 dark:bg-[#262626] border border-neutral-300 dark:border-neutral-700 px-2.5 py-0.5 rounded-lg">
          {circuits.length} circuit{circuits.length !== 1 ? 's' : ''}
        </span>
      </div>

      {circuits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-400 dark:text-neutral-600">
          <Cpu className="w-7 h-7" />
          <span className="text-sm">No circuits yet</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {circuits.map((c) => {
            const style: { badge: string; icon: string } = moduleStyles[
              c.module
            ] ?? {
              badge: 'bg-[#042C5322] text-[#85B7EB] border border-[#185FA555]',
              icon: 'text-[#378ADD]',
            }
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3.5 py-3 bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-[#2a2a2a] rounded-lg hover:bg-neutral-50 dark:hover:bg-[#222] hover:border-neutral-300 dark:hover:border-[#3a3a3a] "
              >
                <div
                  className={`w-8 h-8 rounded-md bg-[#262626] border border-neutral-700 flex items-center justify-center shrink-0 ${style.icon}`}
                >
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">
                    {c.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${style.badge}`}
                    >
                      {c.module}
                    </span>
                    <Clock className="w-2.5 h-2.5 text-neutral-600" />
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      {c.lastEdited}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onOpen?.(c.id)}
                    className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-[#2e2e2e] hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-blue-500 dark:hover:text-blue-400 text-neutral-400 dark:text-neutral-500 "
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete?.(c.id)}
                    className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-[#3d1b1b] hover:border-red-200 dark:hover:border-[#7a2626] hover:text-red-500 dark:hover:text-red-400 text-neutral-400 dark:text-neutral-500 "
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
