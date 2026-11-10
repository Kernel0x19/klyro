'use client'

import Link from 'next/link'
import { CheckCircle2, Home, User } from 'lucide-react'

interface ChangePasswordConfirmModalProps {
  isOpen: boolean
}

export default function ChangePasswordConfirmModal({
  isOpen,
}: ChangePasswordConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#141414] border border-neutral-300 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-5">
        
        {/* Success Icon */}
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Password Changed Successfully
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm">
            Your account credentials have been updated. You can now use your new password on all your devices.
          </p>
        </div>

        {/* Redirect Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <Link
            href="/account"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#4F6EF7] hover:bg-[#3D5CE8] transition-colors cursor-pointer shadow-sm"
          >
            <User className="w-4 h-4" />
            Go to Account
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return to Home
          </Link>
        </div>

      </div>
    </div>
  )
}

