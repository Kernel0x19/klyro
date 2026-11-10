'use client'

import { useState } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Laptop,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import NProgress from 'nprogress'
import { createClient } from '@/lib/supabase/client'
import { createClient as createSupabaseJsClient, type User } from '@supabase/supabase-js'
import { useCooldown } from '@/components/hooks/useCooldown'

interface SecurityCardProps {
  user: User
}

export default function SecurityCard({ user }: SecurityCardProps) {
  const supabase = createClient()
  const email = user.email ?? ''

  // Provider detection
  const provider =
    user.app_metadata?.provider ||
    user.identities?.[0]?.provider ||
    (user.app_metadata?.providers && user.app_metadata.providers[0]) ||
    'email'
  const isGitHub = provider === 'github'
  const gitHubUsername =
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    user.user_metadata?.full_name

  // Email Change State
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Cooldown timers (60s) to prevent spamming email dispatches
  const emailCooldown = useCooldown('email_change', 60)
  const passwordCooldown = useCooldown('password_change', 60)

  // Webmail provider shortcut helper
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

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Sessions State
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsSuccess, setSessionsSuccess] = useState<string | null>(null)

  // 1. Handle Email Update
  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(null)

    const trimmed = newEmail.trim()
    if (!trimmed) {
      setEmailError('Please enter a valid email address.')
      return
    }

    if (emailCooldown.isCoolingDown) {
      setEmailError(
        `Please wait ${emailCooldown.secondsLeft}s before requesting another verification email.`
      )
      return
    }

    if (trimmed.toLowerCase() === email.toLowerCase()) {
      setEmailError('The new email must be different from your current email.')
      return
    }

    setEmailLoading(true)
    NProgress.start()

    // Trigger Supabase email change flow with explicit redirect to completed template (first link sends other-email pending message)
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.updateUser(
      { email: trimmed },
      { emailRedirectTo: `${siteUrl}/auth/verify?type=email_change_completed` }
    )

    setEmailLoading(false)
    NProgress.done()

    if (error) {
      setEmailError(error.message)
    } else {
      emailCooldown.startCooldown(60)
      setEmailSuccess(
        `Verification email sent to ${trimmed}. Please check your inbox and click the confirmation link to complete the change.`
      )
      setNewEmail('')
    }
  }

  // 2. Handle Password Change Verification Email Dispatch
  async function handlePasswordVerificationRequest(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (passwordCooldown.isCoolingDown) {
      setPasswordError(
        `Please wait ${passwordCooldown.secondsLeft}s before requesting another verification email.`
      )
      return
    }

    setPasswordLoading(true)
    NProgress.start()

    // Step A: Require and verify current password for password accounts
    if (!isGitHub) {
      if (!currentPassword) {
        NProgress.done()
        setPasswordLoading(false)
        setPasswordError('Please enter your current password.')
        return
      }

      // Test current password authentication
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (verifyError) {
        setPasswordLoading(false)
        NProgress.done()
        setPasswordError('Current password is incorrect. Please verify and try again.')
        return
      }
    }

    // Step B: Dispatch password change verification email directing to /account/change-password
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    
    // Use an implicit client so the link works cross-browser/cross-profile without PKCE cookie dependency
    const nonPkceClient = createSupabaseJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'implicit',
          persistSession: false,
        },
      }
    )

    const { error: resetError } = await nonPkceClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/account/change-password`,
    })

    setPasswordLoading(false)
    NProgress.done()

    if (resetError) {
      setPasswordError(resetError.message)
    } else {
      passwordCooldown.startCooldown(60)
      setPasswordSuccess(
        `Current password verified! We have sent a password change verification link to ${email}. Please check your inbox and click the link to set your new password.`
      )
      setCurrentPassword('')
      setIsChangingPassword(false)
    }
  }

  // 3. Handle Sign Out of Other Sessions
  async function handleSignOutOthers() {
    setSessionsLoading(true)
    NProgress.start()
    setSessionsSuccess(null)

    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' })
      setSessionsLoading(false)
      NProgress.done()

      if (error) {
        console.error('Error signing out other sessions:', error)
      } else {
        setSessionsSuccess('Successfully signed out of all other active sessions.')
        setTimeout(() => setSessionsSuccess(null), 4000)
      }
    } catch (err) {
      setSessionsLoading(false)
      NProgress.done()
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* 1. Email Address Card (Supabase style) */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Email Address
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                The primary email address associated with your account for sign-in and security notifications.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800">
              <Mail className="w-5 h-5 text-neutral-400" />
              <span className="font-mono text-sm text-neutral-800 dark:text-neutral-200">
                {email}
              </span>
            </div>

            {/* Email change expanded form */}
            {isChangingEmail && (
              <form onSubmit={handleEmailUpdate} className="mt-4 flex flex-col gap-3">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  New Email Address
                </label>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    required
                    disabled={emailLoading}
                    className="flex-1 px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={emailLoading || !newEmail.trim() || emailCooldown.isCoolingDown}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#4F6EF7] hover:bg-[#3D5CE8] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {emailLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {emailLoading
                        ? 'Sending...'
                        : emailCooldown.isCoolingDown
                        ? `Resend in ${emailCooldown.secondsLeft}s`
                        : 'Send Verification'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingEmail(false)
                        setEmailError(null)
                        setEmailSuccess(null)
                      }}
                      disabled={emailLoading}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Rate limit: 1 verification email every 60 seconds to protect against spam.
                </p>
              </form>
            )}

            {/* Status alerts */}
            {emailError && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-500 font-medium">
                <AlertCircle className="w-4 h-4" />
                {emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start justify-between gap-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p>{emailSuccess}</p>
                    {emailCooldown.isCoolingDown && (
                      <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                        You can request another verification email in {emailCooldown.secondsLeft}s.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-[#181818] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>A verification email will be dispatched to confirm ownership of the new address.</span>
          {!isChangingEmail && (
            <button
              type="button"
              onClick={() => {
                setIsChangingEmail(true)
                setEmailSuccess(null)
                setEmailError(null)
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-[#262626] hover:bg-neutral-300 dark:hover:bg-[#333333] transition-colors cursor-pointer"
            >
              Change Email
            </button>
          )}
        </div>
      </div>

      {/* 2. Password & Authentication Card (Accepts Current Password) */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Password & Authentication
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Manage your login credentials and view your linked sign-in providers.
              </p>
            </div>
            
            {/* Provider Badge */}
            {isGitHub ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
                <Image
                  src="/github-logo.svg"
                  alt="GitHub"
                  width={16}
                  height={16}
                  className="w-4 h-4 aspect-square invert dark:invert-0"
                />
                GitHub Connected {gitHubUsername ? `(@${gitHubUsername})` : ''}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Email & Password
              </div>
            )}
          </div>

          <div className="mt-5">
            {isChangingPassword ? (
              <form onSubmit={handlePasswordVerificationRequest} className="flex flex-col gap-4">
                
                {/* Current Password Field (Required for verification) */}
                {!isGitHub ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                      Current Password (to verify identity)
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                        disabled={passwordLoading}
                        className="w-full px-3.5 py-2 pr-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    You are signed in via GitHub. Click below to receive a secure link at{' '}
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                      {email}
                    </span>{' '}
                    to set up an account password.
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={
                      passwordLoading ||
                      (!isGitHub && !currentPassword) ||
                      passwordCooldown.isCoolingDown
                    }
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#4F6EF7] hover:bg-[#3D5CE8] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {passwordLoading
                      ? 'Sending...'
                      : passwordCooldown.isCoolingDown
                      ? `Resend in ${passwordCooldown.secondsLeft}s`
                      : isGitHub
                      ? 'Send Setup Email'
                      : 'Verify & Send Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false)
                      setPasswordError(null)
                      setCurrentPassword('')
                    }}
                    disabled={passwordLoading}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Rate limit: 1 reset verification email every 60 seconds to prevent spam.
                </p>
              </form>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-neutral-400" />
                  <span className="font-mono text-sm tracking-widest text-neutral-500">
                    ••••••••••••••••
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {isGitHub ? 'Linked via GitHub' : 'Active and protected'}
                </span>
              </div>
            )}

            {/* Password status alerts */}
            {passwordError && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-500 font-medium">
                <AlertCircle className="w-4 h-4" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mt-3 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start justify-between gap-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p>{passwordSuccess}</p>
                    {passwordCooldown.isCoolingDown && (
                      <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                        You can request another verification link in {passwordCooldown.secondsLeft}s.
                      </p>
                    )}
                  </div>
                </div>
                {webmailUrl && (
                  <a
                    href={webmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#4F6EF7] hover:underline flex items-center gap-1 shrink-0 mt-0.5"
                  >
                    Open Inbox
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-[#181818] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Current password verification required. A secure link will be sent to your email to set the new password.</span>
          {!isChangingPassword && (
            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(true)
                setPasswordSuccess(null)
                setPasswordError(null)
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-[#262626] hover:bg-neutral-300 dark:hover:bg-[#333333] transition-colors cursor-pointer"
            >
              {isGitHub ? 'Set Account Password' : 'Change Password'}
            </button>
          )}
        </div>
      </div>

      {/* 3. Active Sessions Card */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Active Sessions
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Devices and browser sessions currently logged into your Klyro workspace.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <Laptop className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                    Current Browser Session
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Active now • Signed in on this device
                  </div>
                </div>
              </div>
            </div>

            {sessionsSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {sessionsSuccess}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-[#181818] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Revoke access on public computers or unrecognized browsers.</span>
          <button
            type="button"
            onClick={handleSignOutOthers}
            disabled={sessionsLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-[#262626] hover:bg-neutral-300 dark:hover:bg-[#333333] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {sessionsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Sign Out Other Sessions
          </button>
        </div>
      </div>

    </div>
  )
}
