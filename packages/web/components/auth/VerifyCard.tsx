'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Mail,
  Key,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'

export type VerificationType =
  | 'signup'
  | 'magiclink'
  | 'email_change'
  | 'recovery'

export interface VerifyCardProps {
  type: VerificationType
  email?: string | undefined
}

interface TypeDetails {
  badge: string
  badgeClass: string
  icon: typeof Mail
  iconBgClass: string
  iconColorClass: string
  title: string
  headline: string
  description: string
  steps: string[]
  primaryActionText: string
  primaryActionHref: string
  tip: string
}

const TYPE_CONFIGS: Record<VerificationType, TypeDetails> = {
  signup: {
    badge: 'Account Confirmation',
    badgeClass:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Mail,
    iconBgClass: 'bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
    iconColorClass: 'text-blue-500',
    title: 'Verify your email address',
    headline: 'Almost there! Confirm your account',
    description:
      "We've sent a verification link to your email address. Click the link inside to confirm your account and activate your Klyro lab bench.",
    steps: [
      'Open the verification email sent by Klyro',
      'Click the "Confirm your email" button',
      'Start simulating and saving digital logic circuits',
    ],
    primaryActionText: 'Back to Sign In',
    primaryActionHref: '/auth/login',
    tip: "Didn't receive the email? Check your spam, junk, or promotions folder. It usually arrives within 1 to 2 minutes.",
  },
  magiclink: {
    badge: 'One-Time Sign-In',
    badgeClass:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: Key,
    iconBgClass: 'bg-purple-500/10 border-purple-500/20 shadow-purple-500/10',
    iconColorClass: 'text-purple-500',
    title: 'Magic sign-in link sent',
    headline: 'Password-free instant access',
    description:
      "We've sent a secure, single-use sign-in link to your email. Click the link to log into your account instantly.",
    steps: [
      'Check your inbox on this device or computer',
      'Click the secure sign-in link in the email',
      "You'll be automatically logged in to your workspace",
    ],
    primaryActionText: 'Back to Sign In',
    primaryActionHref: '/auth/login',
    tip: 'For security reasons, magic links expire after 10 minutes and can only be used once.',
  },
  email_change: {
    badge: 'Email Address Update',
    badgeClass:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: RefreshCw,
    iconBgClass: 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
    iconColorClass: 'text-amber-500',
    title: 'Confirm your new email',
    headline: 'Security verification required',
    description:
      'We received a request to update your Klyro account email address. Confirmation is required before the change takes effect.',
    steps: [
      'Confirmation links were sent to both your current and new addresses',
      'Click the verification link in each message to authorize',
      'Your circuits, history, and settings remain untouched',
    ],
    primaryActionText: 'Back to Account',
    primaryActionHref: '/account',
    tip: 'If you did not initiate this change, log in immediately and update your account password.',
  },
  recovery: {
    badge: 'Password Recovery',
    badgeClass:
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: Lock,
    iconBgClass: 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/10',
    iconColorClass: 'text-rose-500',
    title: 'Reset your password',
    headline: 'Password reset link on its way',
    description:
      "We've sent password reset instructions to your email address. Follow the link to choose a new password.",
    steps: [
      'Check your inbox for an email from Klyro Support',
      'Click the "Reset Password" button in the message',
      'Create a new strong password (at least 8 characters)',
    ],
    primaryActionText: 'Back to Sign In',
    primaryActionHref: '/auth/login',
    tip: "The password reset link is valid for 1 hour. If you didn't request a password reset, you can safely ignore the email.",
  },
}

export default function VerifyCard({ type, email }: VerifyCardProps) {
  const config = TYPE_CONFIGS[type] || TYPE_CONFIGS.signup
  const IconComponent = config.icon

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

  return (
    <div className="w-full max-w-lg px-8 py-8 flex flex-col bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-700/60 rounded-2xl gap-6 shadow-xl">
      {/* Top Header & Icon */}
      <div className="flex items-start justify-between gap-4">
        <div
          className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg ${config.iconBgClass}`}
        >
          <IconComponent className={`w-7 h-7 ${config.iconColorClass}`} />
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.badgeClass}`}
        >
          {config.badge}
        </span>
      </div>

      {/* Title & Headline */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {config.title}
        </h1>
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {config.headline}
        </p>
      </div>

      {/* Recipient box (if email is provided) */}
      {email ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#111111] border border-neutral-300 dark:border-neutral-700/60 rounded-xl">
          <Mail className="w-5 h-5 text-neutral-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-400">Recipient email</p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
              {email}
            </p>
          </div>
          {webmailUrl && (
            <a
              href={webmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#4F6EF7] hover:underline flex items-center gap-1 flex-shrink-0"
            >
              Open Inbox
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {config.description}
        </p>
      )}

      {/* Steps List */}
      <div className="flex flex-col gap-2.5 py-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Next steps
        </p>
        <div className="flex flex-col gap-2">
          {config.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-snug">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Informative Tip Box */}
      <div className="flex items-start gap-3 px-4 py-3 bg-neutral-200/60 dark:bg-neutral-800/40 border border-neutral-300/80 dark:border-neutral-700/50 rounded-xl">
        <AlertCircle className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {config.tip}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <Link
          href={config.primaryActionHref}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F6EF7] hover:bg-[#3A57E8] text-white text-base font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-sm"
        >
          {config.primaryActionText}
          <Image
            src="/diagonal-arrow.svg"
            alt="Arrow"
            width={14}
            height={14}
            className="aspect-square"
          />
        </Link>

        <Link
          href="/"
          className="w-full py-2 flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Home
        </Link>
      </div>
    </div>
  )
}
