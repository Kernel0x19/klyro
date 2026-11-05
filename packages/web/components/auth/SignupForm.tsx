'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signUp, signInWithGitHub } from '@/lib/supabase/auth'

export default function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Real-time validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isFullNameValid = fullName.trim().length >= 2
  const isEmailValid = emailRegex.test(email.trim())
  const isPasswordValid = password.length >= 8
  const isConfirmPasswordValid =
    confirmPassword.length > 0 && confirmPassword === password

  const isFormValid =
    isFullNameValid &&
    isEmailValid &&
    isPasswordValid &&
    isConfirmPasswordValid

  // Field error messages shown when field has been interacted with
  const fullNameError =
    touched.fullName && !isFullNameValid
      ? fullName.trim().length === 0
        ? 'Full name is required'
        : 'Name must be at least 2 characters'
      : null

  const emailError =
    touched.email && !isEmailValid
      ? email.trim().length === 0
        ? 'Email address is required'
        : 'Please enter a valid email address'
      : null

  const passwordError =
    touched.password && !isPasswordValid
      ? 'Password must be at least 8 characters long'
      : null

  const confirmPasswordError =
    touched.confirmPassword && !isConfirmPasswordValid
      ? confirmPassword.length === 0
        ? 'Please confirm your password'
        : 'Passwords do not match'
      : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Touch all fields to reveal any remaining errors
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    if (!isFormValid || loading) {
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('fullName', fullName.trim())
    formData.set('email', email.trim())
    formData.set('password', password)
    formData.set('confirmPassword', confirmPassword)

    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      // Form values remain preserved in state!
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-lg px-8 py-5 flex flex-col bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-700/60 rounded-2xl gap-8 shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Create an account
        </h1>
        <p className="text-neutral-500">
          Enter your information below to create your account
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">
            Full Name
          </label>
          <input
            name="fullName"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (error) setError(null)
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
            placeholder="John Doe"
            className={`px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border ${
              fullNameError
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-neutral-300 dark:border-neutral-700/60 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20'
            } rounded-lg outline-none transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600`}
          />
          {fullNameError && (
            <p className="text-xs text-red-500 font-medium">{fullNameError}</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">
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
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            placeholder="you@example.com"
            className={`px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border ${
              emailError
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-neutral-300 dark:border-neutral-700/60 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20'
            } rounded-lg outline-none transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600`}
          />
          {emailError ? (
            <p className="text-xs text-red-500 font-medium">{emailError}</p>
          ) : (
            <p className="text-xs text-neutral-500">
              We&apos;ll use this to contact you. We will not share your email
              with anyone else.
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">
            Password
          </label>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError(null)
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            placeholder="••••••••"
            className={`px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border ${
              passwordError
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-neutral-300 dark:border-neutral-700/60 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20'
            } rounded-lg outline-none transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600`}
          />
          {passwordError ? (
            <p className="text-xs text-red-500 font-medium">{passwordError}</p>
          ) : (
            <p className="text-xs text-neutral-500">
              Must be at least 8 characters long.
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">
            Confirm Password
          </label>
          <input
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (error) setError(null)
            }}
            onBlur={() =>
              setTouched((prev) => ({ ...prev, confirmPassword: true }))
            }
            placeholder="••••••••"
            className={`px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border ${
              confirmPasswordError
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-neutral-300 dark:border-neutral-700/60 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20'
            } rounded-lg outline-none transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600`}
          />
          {confirmPasswordError && (
            <p className="text-xs text-red-500 font-medium">
              {confirmPasswordError}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4F6EF7] text-white text-lg font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-sm"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
        {!loading && (
          <Image
            src="/diagonal-arrow.svg"
            alt="Arrow"
            width={16}
            height={16}
            className="aspect-square"
          />
        )}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700/60" />
        <span className="text-xs text-neutral-400 dark:text-neutral-600">
          or
        </span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700/60" />
      </div>

      <button
        type="button"
        onClick={() => signInWithGitHub()}
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

      <p className="text-center text-neutral-500 dark:text-neutral-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#4F6EF7] hover:underline">
          Log In
        </Link>
      </p>
    </form>
  )
}
