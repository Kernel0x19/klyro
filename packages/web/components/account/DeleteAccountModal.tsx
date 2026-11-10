'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  userEmail,
}: DeleteAccountModalProps) {
  const router = useRouter()
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const isConfirmed =
    confirmationInput.trim().toLowerCase() === userEmail.toLowerCase() ||
    confirmationInput.trim() === 'DELETE'

  async function handleDelete() {
    if (!isConfirmed || isDeleting) return
    setIsDeleting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setErrorMessage(data.error || 'Failed to delete account.')
        setIsDeleting(false)
        return
      }

      // Hard redirect to dedicated account deletion template page
      window.location.href = '/auth/verify?type=account_deleted'
    } catch (err) {
      console.error('Delete account error:', err)
      setErrorMessage('A network error occurred. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#141414] border border-red-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Delete Account
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning text */}
        <div className="p-3.5 rounded-lg bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 leading-relaxed">
          Deleting your account will permanently erase your profile, all saved digital logic circuits, and account credentials. You will lose access immediately.
        </div>

        {/* Input prompt */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            To confirm, please type{' '}
            <span className="font-mono font-bold text-neutral-900 dark:text-white select-all">
              {userEmail}
            </span>{' '}
            or <span className="font-mono font-bold text-red-500">DELETE</span>:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="Type email or DELETE to confirm"
            disabled={isDeleting}
            className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-mono"
          />
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Permanently Delete Account
          </button>
        </div>

      </div>
    </div>
  )
}

