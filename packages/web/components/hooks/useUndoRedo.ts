'use client'

import { useEffect } from 'react'
import { useEditorEdgesStore } from '@/stores/useEditorEdgesStore'

/**
 * Mounts global Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z) keyboard listeners for
 * undo/redo on the wire (edges) history via zundo's temporal store.
 */
export function useUndoRedo() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true'
      if (isInputFocused) return

      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useEditorEdgesStore.temporal.getState().undo()
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        useEditorEdgesStore.temporal.getState().redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
