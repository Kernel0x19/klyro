'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'

interface Props {
  initialTitle?: string | undefined
  projectId?: string | undefined
  userId?: string | undefined
}

export default function ProjectTitle({
  initialTitle = 'Untitled Project',
  projectId,
  userId,
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [editing, setEditing] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function startEditing() {
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function stopEditing() {
    setEditing(false)
    const trimmed = title.trim()
    if (!trimmed) {
      setTitle(initialTitle)
      return
    }
    if (trimmed === initialTitle) return
    if (!projectId || !userId) return

    setSaveState('saving')
    const { error } = await supabase
      .from('circuits')
      .update({ name: trimmed, last_edited: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (!error) {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } else {
      setSaveState('idle')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') stopEditing()
    if (e.key === 'Escape') {
      setTitle(initialTitle)
      setEditing(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center gap-2.5 p-3 cursor-pointer select-none">
        {editing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={stopEditing}
            onKeyDown={handleKeyDown}
            style={{ width: `${Math.max(title.length, 8)}ch` }}
            className="text-2xl text-neutral-600 font-bold bg-transparent border-b border-neutral-600 outline-none"
          />
        ) : (
          <h1
            className="text-2xl text-neutral-600 font-bold hover:text-neutral-400 transition-colors duration-200"
            onClick={startEditing}
          >
            {title}
          </h1>
        )}
      </div>

      {saveState !== 'idle' && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1a1a1a] border border-neutral-700/60 rounded-xl shadow-xl">
          {saveState === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#4F6EF7]" />
              <span className="text-sm font-medium text-neutral-300">
                Saving...
              </span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-neutral-300">
                Saved
              </span>
            </>
          )}
        </div>
      )}
    </>
  )
}
