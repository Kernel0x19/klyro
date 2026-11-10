'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import ModuleTransitionOverlay from './ModuleTransitionOverlay'

const Modules = ['Board', 'K-Map Visualiser', 'FSM', 'PLD', 'HDL', 'Learn']

function toParam(module: string) {
  return module.toLowerCase().replace(/\s+/g, '-')
}
function fromParam(param: string) {
  return Modules.find((m) => toParam(m) === param) ?? 'Board'
}

export default function ModuleSelection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [active, setActive] = useState('Board')
  /** The param string of the module currently being navigated to, null when settled */
  const [pendingModule, setPendingModule] = useState<string | null>(null)

  // Sync active tab from URL
  useEffect(() => {
    const selectedModule = searchParams.get('module')
    if (selectedModule) setActive(fromParam(selectedModule))
    else setActive('Board')
  }, [searchParams])

  // When searchParams settle, clear the pending state
  useEffect(() => {
    if (pendingModule !== null) {
      setPendingModule(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function handleSelect(module: string) {
    if (module === active) return // already on this module
    setActive(module)

    const param = toParam(module)
    // Show loading overlay immediately
    setPendingModule(param)

    const target = param === 'board' ? pathname : `${pathname}?module=${param}`
    router.push(target, { scroll: false })
  }

  return (
    <>
      {/* Module transition overlay — only visible during navigation */}
      <ModuleTransitionOverlay
        pendingModule={pendingModule}
        onSettled={() => setPendingModule(null)}
      />

      <div className="h-full flex items-center justify-center gap-10 py-4">
        {Modules.map((link) => (
          <React.Fragment key={link}>
            <span
              onClick={() => handleSelect(link)}
              className="text-xl font-semibold cursor-pointer pb-0.5"
              style={{
                color: active === link ? '#4F6EF7' : '',
                borderBottom: `1px solid ${active === link ? '#4F6EF7' : 'transparent'}`,
                transition: 'border-color 400ms, color 200ms',
              }}
              onMouseEnter={(e) => {
                if (active !== link)
                  e.currentTarget.style.borderBottomColor = '#4F6EF7'
              }}
              onMouseLeave={(e) => {
                if (active !== link)
                  e.currentTarget.style.borderBottomColor = 'transparent'
              }}
            >
              {link}
            </span>
          </React.Fragment>
        ))}
      </div>
    </>
  )
}
