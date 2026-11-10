'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Mail,
  Key,
  RefreshCw,
  Lock,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Trash2,
  Bell,
  Loader2,
  AlertCircle,
  KeyRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCooldown } from '@/components/hooks/useCooldown'
import type { EmailOtpType } from '@supabase/supabase-js'

export type VerificationType =
  | 'signup'
  | 'magiclink'
  | 'email_change'
  | 'email_change_pending'
  | 'email_change_completed'
  | 'recovery'
  | 'password_updated'
  | 'verified'
  | 'account_deleted'
  | 'status'

export interface VerifyCardProps {
  type: VerificationType
  email?: string | undefined
  message?: string | undefined
}

interface TypeDetails {
  badge: string
  badgeClass: string
  icon: typeof Mail
  iconBgClass: string
  iconColorClass: string
  title: string
  description: string
  primaryActionText: string
  primaryActionHref: string
}

const TYPE_CONFIGS: Record<VerificationType, TypeDetails> = {
  signup: {
    badge: 'Account Confirmation',
    badgeClass:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Mail,
    iconBgClass: 'bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
    iconColorClass: 'text-blue-500',
    title: 'Check your email',
    description:
      'We sent a verification link and code to confirm your account and activate your Klyro workspace.',
    primaryActionText: 'Back to Sign In',
    primaryActionHref: '/auth/login',
  },
  magiclink: {
    badge: 'One-Time Sign-In',
    badgeClass:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: Key,
    iconBgClass: 'bg-purple-500/10 border-purple-500/20 shadow-purple-500/10',
    iconColorClass: 'text-purple-500',
    title: 'Magic link sent',
    description:
      'We sent a secure sign-in link and verification code to your inbox. Use either method to log in.',
    primaryActionText: 'Back to Sign In',
    primaryActionHref: '/auth/login',
  },
  email_change: {
    badge: 'Email Update',
    badgeClass:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: RefreshCw,
    iconBgClass: 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
    iconColorClass: 'text-amber-500',
    title: 'Confirm email change',
    description:
      'A verification link was dispatched to authorize this email update. Please check your inbox.',
    primaryActionText: 'Back to Account Settings',
    primaryActionHref: '/account',
  },
  email_change_pending: {
    badge: 'Email Change Pending',
    badgeClass:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: RefreshCw,
    iconBgClass: 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
    iconColorClass: 'text-amber-500',
    title: 'First link confirmed',
    description:
      'Confirmation link accepted! A second verification link was sent to your other email address. Please click it to complete the update.',
    primaryActionText: 'Go to Account Settings',
    primaryActionHref: '/account',
  },
  email_change_completed: {
    badge: 'Email Updated',
    badgeClass:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
    iconBgClass: 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    iconColorClass: 'text-emerald-500',
    title: 'Email updated successfully',
    description:
      'Your Klyro account email address has been updated. You can now use your new email for signing in and receiving security alerts.',
    primaryActionText: 'Back to Account Settings',
    primaryActionHref: '/account',
  },
  password_updated: {
    badge: 'Password Updated',
    badgeClass:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Lock,
    iconBgClass: 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    iconColorClass: 'text-emerald-500',
    title: 'Password changed successfully',
    description:
      'Your account password has been updated. A security notification was dispatched to your email address.',
    primaryActionText: 'Back to Account Settings',
    primaryActionHref: '/account',
  },
  account_deleted: {
    badge: 'Account Deleted',
    badgeClass:
      'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    icon: Trash2,
    iconBgClass: 'bg-red-500/10 border-red-500/20 shadow-red-500/10',
    iconColorClass: 'text-red-500',
    title: 'Account deleted',
    description:
      'Your account, saved logic circuits, profile details, and active sessions have been permanently removed.',
    primaryActionText: 'Return to Home',
    primaryActionHref: '/',
  },
  status: {
    badge: 'Notification',
    badgeClass:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Bell,
    iconBgClass: 'bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
    iconColorClass: 'text-blue-500',
    title: 'Notice',
    description: 'Your request has been processed.',
    primaryActionText: 'Back to Account Settings',
    primaryActionHref: '/account',
  },
  recovery: {
    badge: 'Password Recovery',
    badgeClass:
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: Lock,
    iconBgClass: 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/10',
    iconColorClass: 'text-rose-500',
    title: 'Check your email',
    description:
      "We've sent password reset instructions and a verification code to your email. Follow the link or enter the code to set a new password.",
    primaryActionText: 'Back to Sign In',
    primaryActionHref: '/auth/login',
  },
  verified: {
    badge: 'Email Verified',
    badgeClass:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
    iconBgClass: 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    iconColorClass: 'text-emerald-500',
    title: 'Email confirmed',
    description:
      'Your email address has been verified. You can now log in to access your digital logic circuits and simulation bench.',
    primaryActionText: 'Proceed to Log In',
    primaryActionHref: '/auth/login?verified=true',
  },
}

export default function VerifyCard({ type, email, message }: VerifyCardProps) {
  const config = TYPE_CONFIGS[type] || TYPE_CONFIGS.signup
  const IconComponent = config.icon
  const supabase = createClient()

  // OTP Verification state
  const isOtpSupported =
    type === 'signup' ||
    type === 'magiclink' ||
    type === 'recovery' ||
    type === 'email_change'

  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  // Resend Cooldown state (60s timer)
  const resendCooldown = useCooldown(`verify_resend_${email || type}`, 60)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)

  useEffect(() => {
    // Strip hash fragments (e.g. #message=... or #sb=) if lingering in address bar
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      )
    }
  }, [])

  // Helper to open common webmail providers if email is recognized
  const getWebmailUrl = (emailAddr?: string) => {
    if (!emailAddr) return null
    const domain = emailAddr.split('@')[1]?.toLowerCase()
    if (domain === 'gmail.com') return 'https://mail.google.com'
    if (domain === 'outlook.com' || domain === 'hotmail.com')
      return 'https://outlook.live.com'
    if (domain === 'yahoo.com') return 'https://mail.yahoo.com'
    return null
  }

  const webmailUrl = getWebmailUrl(email)
  const displayDescription = message || config.description

  // Handle OTP verification (supports 6 to 8 digits)
  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = otpCode.trim()
    if (!email || trimmed.length < 6 || trimmed.length > 8) return

    setOtpLoading(true)
    setOtpError(null)

    const otpType: EmailOtpType =
      type === 'recovery'
        ? 'recovery'
        : type === 'signup'
        ? 'signup'
        : type === 'email_change'
        ? 'email_change'
        : 'email'

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: otpType,
    })

    setOtpLoading(false)

    if (error) {
      setOtpError(error.message)
    } else {
      if (type === 'recovery') {
        window.location.href = '/account/change-password'
      } else if (type === 'email_change') {
        window.location.href = '/auth/verify?type=email_change_completed'
      } else {
        window.location.href = '/editor'
      }
    }
  }

  // Handle Resend Email with rate limit check
  async function handleResend() {
    if (!email || resendCooldown.isCoolingDown || resendLoading) return

    setResendLoading(true)
    setResendSuccess(null)
    setOtpError(null)

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

    try {
      if (type === 'signup') {
        await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        })
      } else if (type === 'recovery') {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/account/change-password`,
        })
      } else if (type === 'magiclink') {
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback?next=/editor`,
          },
        })
      }

      resendCooldown.startCooldown(60)
      setResendSuccess('Verification email resent! Please check your spam folder.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification email'
      setOtpError(msg)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md px-7 py-7 flex flex-col bg-neutral-100 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 rounded-2xl gap-5 shadow-lg">
      {/* Icon & Badge Header */}
      <div className="flex items-center justify-between gap-3">
        <div
          className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-xs ${config.iconBgClass}`}
        >
          <IconComponent className={`w-6 h-6 ${config.iconColorClass}`} />
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.badgeClass}`}
        >
          {config.badge}
        </span>
      </div>

      {/* Title & Concise Message */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {config.title}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {displayDescription}
        </p>
      </div>

      {/* Target Email Banner (if available) */}
      {email && (
        <div className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 truncate">
              {email}
            </span>
          </div>
          {webmailUrl && (
            <a
              href={webmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#4F6EF7] hover:underline flex items-center gap-1 shrink-0"
            >
              Open Inbox
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* OTP Verification Input (When supported and email is present) */}
      {isOtpSupported && email && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#4F6EF7]" />
              Enter Verification Code (OTP)
            </label>
            <span className="text-[11px] text-neutral-400">from your email</span>
          </div>

          <form onSubmit={handleVerifyOtp} className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setOtpCode(val)
                if (otpError) setOtpError(null)
              }}
              placeholder="— — — — — — — —"
              className="flex-1 font-mono text-center tracking-[0.25em] text-sm font-semibold px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1A1A1A] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 placeholder:tracking-[0.15em] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]"
            />
            <button
              type="submit"
              disabled={otpLoading || otpCode.trim().length < 6}
              className="px-4 py-2 bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              {otpLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Verify
            </button>
          </form>

          {otpError && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}
        </div>
      )}

      {/* Resend Success Banner */}
      {resendSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resendSuccess}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5 pt-1">
        <Link
          href={config.primaryActionHref}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F6EF7] hover:bg-[#3A57E8] text-white text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer shadow-sm"
        >
          {config.primaryActionText}
          <Image
            src="/diagonal-arrow.svg"
            alt="Arrow"
            width={13}
            height={13}
            className="aspect-square"
          />
        </Link>

        {type === 'verified' && (
          <Link
            href="/editor"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer shadow-sm"
          >
            Launch Editor
            <Image
              src="/diagonal-arrow.svg"
              alt="Arrow"
              width={13}
              height={13}
              className="aspect-square invert dark:invert-0"
            />
          </Link>
        )}

        <Link
          href="/"
          className="w-full py-1.5 flex items-center justify-center gap-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Home
        </Link>
      </div>

      {/* Resend Email Section with Anti-Spam Rate Limit Cooldown */}
      {(type === 'signup' || type === 'recovery' || type === 'magiclink') && email && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200 dark:border-neutral-800/80">
          <span className="text-neutral-500">Didn&apos;t receive the email?</span>
          <button
            type="button"
            disabled={resendLoading || resendCooldown.isCoolingDown}
            onClick={handleResend}
            className="font-medium text-[#4F6EF7] hover:underline disabled:text-neutral-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
          >
            {resendLoading
              ? 'Resending...'
              : resendCooldown.isCoolingDown
              ? `Resend in ${resendCooldown.secondsLeft}s`
              : 'Resend email'}
          </button>
        </div>
      )}

      {/* Discreet footer note for email actions without email prop */}
      {(!email || (type !== 'signup' && type !== 'recovery' && type !== 'magiclink')) &&
        (type === 'email_change' || type === 'email_change_pending') && (
          <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-500 pt-1 border-t border-neutral-200 dark:border-neutral-800/80">
            Didn&apos;t receive the email? Check your spam folder or try again from settings.
          </p>
        )}
    </div>
  )
}
