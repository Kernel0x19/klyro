'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCooldown } from '@/components/hooks/useCooldown'

export default function ForgotPasswordForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const cooldown = useCooldown('forgot_password', 60)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }

    if (cooldown.isCoolingDown) {
      setError(`Please wait ${cooldown.secondsLeft}s before requesting another reset email.`)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${siteUrl}/account/change-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      cooldown.startCooldown(60)
      setSuccess(`Password reset instructions and verification code sent to ${trimmed}. Check your inbox!`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg px-8 py-8 flex flex-col bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-700/60 rounded-2xl gap-6 shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-[#4F6EF7]" />
          Reset password
        </h1>
        <p className="text-neutral-500 text-sm">
          Enter your email address and we&apos;ll send you a secure link to reset your password.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            <p>{success}</p>
            {cooldown.isCoolingDown && (
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                You can request another reset link in {cooldown.secondsLeft}s.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">
          Email address
        </label>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          placeholder="you@example.com"
          required
          disabled={loading}
          className="px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
        />
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
          Rate limit: 1 reset email every 60 seconds to protect account security.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !email.trim() || cooldown.isCoolingDown}
        className="w-full py-2.5 bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-60 text-white font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading
          ? 'Sending instructions...'
          : cooldown.isCoolingDown
          ? `Resend in ${cooldown.secondsLeft}s`
          : 'Send Reset Link'}
      </button>

      <Link
        href="/auth/login"
        className="w-full py-1.5 flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </Link>
    </form>
  )
}

