// components/auth/SignupForm.tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signUp, signInWithGitHub } from '@/lib/supabase/auth'

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    setError(null)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form
      action={handleSubmit}
      className="w-full max-w-lg px-8 py-5 flex flex-col bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-700/60 rounded-2xl gap-8"
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
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">
            Full Name
          </label>
          <input
            name="fullName"
            type="text"
            placeholder="John Doe"
            required
            className="px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">
            Email
          </label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
          <p className="text-sm text-neutral-500">
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">
            Password
          </label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
          <p className="text-sm text-neutral-500">
            Must be at least 8 characters long.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">
            Confirm Password
          </label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            className="px-4 py-2.5 bg-white dark:bg-[#111111] text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-60 text-white text-lg font-bold rounded-lg transition-all duration-200 cursor-pointer"
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
