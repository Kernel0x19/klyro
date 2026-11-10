'use client'

import { useEffect } from 'react'

/**
 * AuthHashHandler catches auth-related query and hash fragment redirects
 * (e.g. from Supabase email confirmations landing on the homepage)
 * and immediately forwards the user to their dedicated template status page.
 */
export default function AuthHashHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check search parameters
    const searchParams = new URLSearchParams(window.location.search)
    // 2. Check hash parameters (Supabase appends #message=... or #access_token=...)
    const rawHash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash
    const hashParams = new URLSearchParams(rawHash)

    const rawMessage =
      searchParams.get('message') ||
      hashParams.get('message') ||
      searchParams.get('error_description') ||
      hashParams.get('error_description')

    const isDeleted = searchParams.get('deleted') === 'true'

    if (isDeleted) {
      window.location.replace('/auth/verify?type=account_deleted')
      return
    }

    if (rawMessage) {
      // Decode if needed and clean formatting
      const cleanMessage = decodeURIComponent(rawMessage.replace(/\+/g, ' '))
      const lower = cleanMessage.toLowerCase()

      let targetType = 'status'
      if (lower.includes('other email') || lower.includes('confirm link sent to')) {
        targetType = 'email_change_pending'
      } else if (
        lower.includes('email') &&
        (lower.includes('confirm') ||
          lower.includes('accepted') ||
          lower.includes('updated') ||
          lower.includes('changed'))
      ) {
        targetType = 'email_change_completed'
      } else if (lower.includes('password')) {
        targetType = 'password_updated'
      } else if (lower.includes('delete') || lower.includes('deleted')) {
        targetType = 'account_deleted'
      }

      // Cleanly redirect to the dedicated template, stripping hashes and long query parameters
      window.location.replace(
        `/auth/verify?type=${targetType}&message=${encodeURIComponent(cleanMessage)}`
      )
    }
  }, [])

  return null
}

