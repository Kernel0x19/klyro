'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import NProgress from 'nprogress'
import ChangePasswordConfirmModal from '@/components/account/ChangePasswordConfirmModal'

interface ChangePasswordFormProps {
  userEmail?: string | undefined
}

export default function ChangePasswordForm({ userEmail }: ChangePasswordFormProps) {
  const supabase = createClient()
  const [resolvedEmail, setResolvedEmail] = useState<string | undefined>(userEmail)
  const [checkingAuth, setCheckingAuth] = useState(!userEmail)
  const [authExpired, setAuthExpired] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    // 1. If email was passed from server session, we are already authenticated
    if (userEmail) {
      setCheckingAuth(false)
      return
    }

    // 2. Check client-side session (handles URL hash #access_token=... from recovery link)
    let isMounted = true
    let authListenerSubscription: { unsubscribe: () => void } | null = null
    let timer: NodeJS.Timeout | null = null

    async function checkClientAuth() {
      try {
        // A. If tokens are directly present in the hash fragment, set the session immediately
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken && refreshToken) {
            const { data: setSessionData, error: setSessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              })

            if (setSessionData?.user && !setSessionError && isMounted) {
              setResolvedEmail(setSessionData.user.email)
              setCheckingAuth(false)
              setTimeout(() => {
                window.history.replaceState(null, '', window.location.pathname)
              }, 500)
              return
            }
          }
        }

        // B. Check existing session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user && isMounted) {
          setResolvedEmail(session.user.email)
          setCheckingAuth(false)
          return
        }

        // C. Listen for PASSWORD_RECOVERY or SIGNED_IN event from Supabase
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (
              (event === 'PASSWORD_RECOVERY' ||
                event === 'SIGNED_IN' ||
                event === 'USER_UPDATED') &&
              session?.user &&
              isMounted
            ) {
              setResolvedEmail(session.user.email)
              setCheckingAuth(false)
            }
          }
        )
        authListenerSubscription = authListener.subscription

        // Fallback timeout: if no valid recovery session is detected after 3s
        timer = setTimeout(async () => {
          if (isMounted) {
            const {
              data: { session: finalSession },
            } = await supabase.auth.getSession()
            if (!finalSession?.user && isMounted) {
              setAuthExpired(true)
            }
            setCheckingAuth(false)
          }
        }, 3000)
      } catch (err) {
        console.error('Error resolving recovery session:', err)
        if (isMounted) {
          setCheckingAuth(false)
          setAuthExpired(true)
        }
      }
    }

    checkClientAuth()

    return () => {
      isMounted = false
      if (authListenerSubscription) {
        authListenerSubscription.unsubscribe()
      }
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [userEmail, supabase.auth])

  const isLengthValid = newPassword.length >= 8
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword
  const isFormValid = isLengthValid && isMatch

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isLengthValid) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!isMatch) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    NProgress.start()

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      setLoading(false)
      NProgress.done()

      if (updateError) {
        setError(updateError.message)
      } else {
        setShowSuccessModal(true)
      }
    } catch (err: unknown) {
      setLoading(false)
      NProgress.done()
      setError('An unexpected error occurred. Please try again.')
      console.error(err)
    }
  }

  // State A: Checking / Verifying recovery link
  if (checkingAuth) {
    return (
      <div className="w-full max-w-md px-8 py-10 flex flex-col items-center justify-center bg-neutral-100 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 rounded-2xl gap-4 shadow-xl">
        <Loader2 className="w-8 h-8 text-[#4F6EF7] animate-spin" />
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Verifying security authorization...
        </p>
      </div>
    )
  }

  // State B: Auth link expired or invalid
  if (authExpired && !resolvedEmail) {
    return (
      <div className="w-full max-w-md px-8 py-8 flex flex-col items-center text-center bg-neutral-100 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 rounded-2xl gap-5 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Link Expired or Invalid
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            This password change link is invalid, has expired, or was already used. Please request a new verification link from your account settings.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F6EF7] hover:bg-[#3D5CE8] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md px-8 py-8 flex flex-col bg-neutral-100 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 rounded-2xl gap-6 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Password Update
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Set New Password
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {resolvedEmail ? (
              <>
                Updating password for{' '}
                <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                  {resolvedEmail}
                </span>
              </>
            ) : (
              'Enter your new password below to update your account credentials.'
            )}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Fields */}
        <div className="flex flex-col gap-4">
          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {newPassword.length > 0 && !isLengthValid && (
              <p className="text-xs text-red-500">Must be at least 8 characters</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && !isMatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F6EF7] hover:bg-[#3D5CE8] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer shadow-sm mt-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Password
        </button>
      </form>

      {/* Confirmation Dialog with redirects to Account & Home */}
      <ChangePasswordConfirmModal isOpen={showSuccessModal} />
    </>
  )
}
