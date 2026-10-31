'use client'
import { useState, useRef } from 'react'

interface Props {
  initialTitle?: string | undefined  // explicitly allow undefined
}

export default function ProjectTitle({
  initialTitle = 'Untitled Project',
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function stopEditing() {
    setEditing(false)
    if (!title.trim()) setTitle(initialTitle)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') stopEditing()
    if (e.key === 'Escape') {
      setTitle(title)
      setEditing(false)
    }
  }

  return (
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
  )
}
