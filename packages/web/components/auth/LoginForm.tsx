'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Loader2,
  Lock,
} from 'lucide-react'
import { signIn, signInWithGitHub } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import { useCooldown } from '@/components/hooks/useCooldown'
import NProgress from 'nprogress'

interface LoginFormProps {
  verified?: boolean | undefined
  urlError?: string | undefined
}

export default function LoginForm({ verified, urlError }: LoginFormProps) {
  const supabase = createClient()

  // Auth mode: standard 'password' or passwordless 'otp'
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password')

  // Password login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // OTP login state
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null)
  const otpCooldown = useCooldown('login_otp', 60)

  useEffect(() => {
    // If arriving at login with a recovery token hash (e.g. from password reset email), forward to change-password
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash
      if (
        hash.includes('access_token=') &&
        (hash.includes('type=recovery') || hash.includes('type=invite'))
      ) {
        window.location.replace(`/account/change-password${hash}`)
      }
    }
  }, [])

  // 1. Handle Password Sign-In
  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    NProgress.start()
    setError(null)

    const formData = new FormData()
    formData.set('email', email.trim())
    formData.set('password', password)

    const result = await signIn(formData)
    if (result?.error) {
      NProgress.done()
      setError(result.error)
      setLoading(false)
      // Input values (email and password) remain fully preserved in state
    }
  }

  // 2. Handle Dispatching OTP Code & Magic Link
  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }

    if (otpCooldown.isCoolingDown) {
      setError(`Please wait ${otpCooldown.secondsLeft}s before requesting another verification code.`)
      return
    }

    setOtpLoading(true)
    NProgress.start()
    setError(null)
    setOtpSuccess(null)

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const { error: otpSendError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=/editor`,
      },
    })

    NProgress.done()
    setOtpLoading(false)

    if (otpSendError) {
      setError(otpSendError.message)
    } else {
      otpCooldown.startCooldown(60)
      setOtpSent(true)
      setOtpSuccess(`Verification code & sign-in link dispatched to ${trimmed}. Check your inbox!`)
    }
  }

  // 3. Handle Verifying OTP Code (supports 6 to 8 digits)
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedCode = otpCode.trim()

    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }

    if (trimmedCode.length < 6 || trimmedCode.length > 8) {
      setError('Please enter a valid verification code (6 to 8 digits).')
      return
    }

    setLoading(true)
    NProgress.start()
    setError(null)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedCode,
      type: 'email',
    })

    if (verifyError) {
      NProgress.done()
      setError(verifyError.message)
      setLoading(false)
    } else {
      window.location.href = '/editor'
    }
  }

  return (
    <div className="w-full max-w-lg px-8 py-8 flex flex-col bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-700/60 rounded-2xl gap-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {authMode === 'password' ? 'Welcome back' : 'Sign in with OTP'}
        </h1>
        <p className="text-neutral-500 text-sm">
          {authMode === 'password'
            ? 'Enter your credentials to sign in to your account'
            : 'Enter your email to receive a verification code and instant sign-in link'}
        </p>
      </div>

      {verified && !error && (
        <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            Email verified successfully! You can now log in to your account.
          </p>
        </div>
      )}

      {urlError === 'verification_failed' && !error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500 text-sm">
            Verification link was invalid or has expired. Please try signing in.
          </p>
        </div>
      )}

      {urlError === 'cross_browser_recovery' && !error && (
        <div className="px-4 py-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs text-amber-700 dark:text-amber-400">
            <span className="font-semibold text-sm">Opened in a different browser profile</span>
            <p className="leading-relaxed">
              This security verification link was opened in a different browser or profile than the one where you initiated the request.
              Please copy the link from your email and paste it into the browser window/profile where you requested the password change.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {otpSuccess && (
        <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">{otpSuccess}</p>
        </div>
      )}

      {/* Mode 1: Password Form */}
      {authMode === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">
              Email
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
              className="px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[#4F6EF7] text-sm cursor-pointer hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 pr-11 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-60 text-white font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>
      )}

      {/* Mode 2: Passwordless OTP Form */}
      {authMode === 'otp' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">
              Email
            </label>
            <div className="flex gap-2">
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
                disabled={otpLoading}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-sm"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading || !email.trim() || otpCooldown.isCoolingDown}
                className="px-4 py-2.5 bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {otpLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {otpLoading
                  ? 'Sending...'
                  : otpCooldown.isCoolingDown
                  ? `Resend in ${otpCooldown.secondsLeft}s`
                  : otpSent
                  ? 'Resend Code'
                  : 'Send Code'}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Rate limit: 1 request every 60 seconds to protect account security.
            </p>
          </div>

          {/* OTP Code entry form */}
          {otpSent && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 text-sm flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#4F6EF7]" />
                    Verification Code (OTP)
                  </label>
                  <span className="text-xs text-neutral-400">from your email</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtpCode(val)
                    if (error) setError(null)
                  }}
                  placeholder="— — — — — — — —"
                  required
                  className="w-full text-center font-mono tracking-[0.25em] text-lg font-bold px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:tracking-[0.15em] placeholder:font-normal placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.trim().length < 6}
                className="w-full py-2.5 bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-60 text-white font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Verifying...' : 'Verify Code & Sign In'}
              </button>

              <p className="text-center text-xs text-neutral-500">
                You can also click the magic link sent directly to your inbox to sign in instantly.
              </p>
            </form>
          )}
        </div>
      )}

      {/* Social and Alternate Methods */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700/60" />
        <span className="text-xs text-neutral-400">or</span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700/60" />
      </div>

      <button
        type="button"
        onClick={() => {
          NProgress.start()
          signInWithGitHub()
        }}
        className="w-full py-2.5 flex items-center justify-center gap-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 hover:border-neutral-400 dark:hover:border-neutral-500 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer"
      >
        <Image
          width={16}
          height={16}
          src="/github-logo.svg"
          alt="GitHub"
          className="w-4 h-4 invert dark:invert-0"
        />
        Continue with GitHub
      </button>

      {/* OTP / Password Toggle Option below GitHub Login */}
      <button
        type="button"
        onClick={() => {
          setAuthMode(authMode === 'password' ? 'otp' : 'password')
          setError(null)
          setOtpSuccess(null)
        }}
        className="w-full py-2.5 flex items-center justify-center gap-2 bg-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700/60 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer"
      >
        {authMode === 'password' ? (
          <>
            <KeyRound className="w-4 h-4 text-[#4F6EF7]" />
            Sign in with OTP or Verification Link
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-[#4F6EF7]" />
            Sign in with Password instead
          </>
        )}
      </button>

      <p className="text-center text-neutral-500 dark:text-neutral-600 text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-[#4F6EF7] hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  )
}
