'use client'
import { useState } from 'react'
import { ExternalLink, Trash2, Clock, Cpu, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { deleteProject } from '@/lib/supabase/projects'
import Image from 'next/image'
import { openOrCreateProject } from '@/lib/supabase/projects'

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

type Circuit = {
  id: string
  name: string
  module: string
  lastEdited: string
  projectId: string
}

interface CirHis {
  circuits?: Circuit[]
  onDelete?: (projectId: string) => void
  onOpen?: (projectId: string) => void
}

export function CircuitHistory({ circuits = [], onDelete }: CirHis) {
  const [pendingDelete, setPendingDelete] = useState<Circuit | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [localCircuits, setLocalCircuits] = useState<Circuit[]>(circuits)

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    const result = await deleteProject(pendingDelete.projectId)
    setDeleting(false)
    setPendingDelete(null)
    if (!result.error) {
      setLocalCircuits((prev) =>
        prev.filter((c) => c.projectId !== pendingDelete.projectId)
      )
      onDelete?.(pendingDelete.projectId)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
            Circuit History
          </h2>
          <span className="text-neutral-500 font-bold bg-neutral-200 dark:bg-[#262626] border border-neutral-300 dark:border-neutral-700 px-2.5 py-0.5 rounded-lg">
            {localCircuits.length} circuit{localCircuits.length !== 1 ? 's' : ''}
          </span>
        </div>

        {localCircuits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-400 dark:text-neutral-600">
            <Cpu className="w-7 h-7" />
            <span className="text-sm">No circuits yet</span>
            <form action={openOrCreateProject}>
              <button
                type="submit"
                className="text-white flex items-center justify-center px-4 py-3 bg-get-started text-xl font-bold gap-2 transition-all duration-500 hover:bg-get-started-hover hover:rounded-xl cursor-pointer group"
              >
                Launch Editor
                <Image
                  src="/diagonal-arrow.svg"
                  alt="Arrow"
                  width={16}
                  height={16}
                  className="aspect-square"
                />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {localCircuits.map((c) => {
              const style: { badge: string; icon: string } = moduleStyles[
                c.module
              ] ?? {
                badge:
                  'bg-[#042C5322] text-[#85B7EB] border border-[#185FA555]',
                icon: 'text-[#378ADD]',
              }
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3.5 py-3 bg-white dark:bg-[#1e1e1e] border border-neutral-400 dark:border-[#2a2a2a] rounded-lg hover:bg-neutral-50 dark:hover:bg-[#222]"
                >
                  <div
                    className={`w-12 h-12 rounded-md bg-[#262626] border border-neutral-700 flex items-center justify-center shrink-0 ${style.icon}`}
                  >
                    <Cpu className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-neutral-700 dark:text-neutral-200 truncate">
                      {c.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-sm font-medium px-1.5 py-0.5 rounded-full ${style.badge}`}
                      >
                        {c.module}
                      </span>
                      <Clock className="w-2.5 h-2.5 text-neutral-600" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-500">
                        {c.lastEdited}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/editor/${c.projectId}`}>
                      <button className="w-10 h-10 rounded-md bg-neutral-100 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-[#2e2e2e] hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-blue-500 dark:hover:text-blue-400 text-neutral-400 dark:text-neutral-500 hover:cursor-pointer">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </Link>
                    <button
                      onClick={() => setPendingDelete(c)}
                      className="w-10 h-10 rounded-md bg-neutral-100 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-[#3d1b1b] hover:border-red-200 dark:hover:border-[#7a2626] hover:text-red-500 dark:hover:text-red-400 text-neutral-400 dark:text-neutral-500 hover:cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                  Delete project?
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {pendingDelete.name}
                  </span>{' '}
                  will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-100 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#2e2e2e] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
