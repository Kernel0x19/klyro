import { create } from 'zustand'

interface ToastState {
  toast: { message: string; id: number } | null
  showToast: (message: string) => void
  dismissToast: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (message: string) => {
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }
    set({ toast: { message, id: Date.now() } })
    toastTimer = setTimeout(() => {
      set({ toast: null })
      toastTimer = null
    }, 4000)
  },
  dismissToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }
    set({ toast: null })
  },
}))
