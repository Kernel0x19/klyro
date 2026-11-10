'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * useCooldown provides a rate-limiting countdown timer that persists in localStorage
 * so users cannot spam email requests by refreshing the page.
 */
export function useCooldown(key: string, defaultDuration = 60) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(`klyro_cooldown_${key}`)
    if (stored) {
      const expiry = parseInt(stored, 10)
      const now = Date.now()
      if (expiry > now) {
        setSecondsLeft(Math.ceil((expiry - now) / 1000))
      } else {
        localStorage.removeItem(`klyro_cooldown_${key}`)
      }
    }
  }, [key])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          localStorage.removeItem(`klyro_cooldown_${key}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsLeft, key])

  const startCooldown = useCallback(
    (duration = defaultDuration) => {
      const expiry = Date.now() + duration * 1000
      localStorage.setItem(`klyro_cooldown_${key}`, String(expiry))
      setSecondsLeft(duration)
    },
    [key, defaultDuration]
  )

  return {
    secondsLeft,
    isCoolingDown: secondsLeft > 0,
    startCooldown,
  }
}

