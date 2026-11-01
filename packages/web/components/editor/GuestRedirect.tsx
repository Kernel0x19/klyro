'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function GuestRedirectInner({
  currentProjectId,
}: {
  currentProjectId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const stored = localStorage.getItem('klyro_recent_projects')
    if (!stored) return

    try {
      const ids = JSON.parse(stored) as string[]
      const lastId = ids[0]
      if (lastId && lastId !== currentProjectId) {
        const module = searchParams.get('module') ?? 'board'
        router.replace(`/editor/${lastId}?module=${module}`)
      }
    } catch {}
  }, [currentProjectId, router, searchParams])

  return null
}

export default function GuestRedirect({
  currentProjectId,
}: {
  currentProjectId: string
}) {
  return (
    <Suspense fallback={null}>
      <GuestRedirectInner currentProjectId={currentProjectId} />
    </Suspense>
  )
}
