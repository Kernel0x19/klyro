'use client'

import { useState, useTransition } from 'react'
import { Cpu, Grid3x3, Workflow } from 'lucide-react'
import Image from 'next/image'
import NProgress from 'nprogress'
import { openOrCreateProject } from '@/lib/supabase/projects'

const cards = [
  {
    Icon: Cpu,
    title: 'IC Circuit Board',
    desc: 'Place real 74LS and 74HC series ICs on a virtual breadboard and wire them up.',
    cta: 'Open Board',
    module: 'board',
  },
  {
    Icon: Grid3x3,
    title: 'K-Map Solver',
    desc: 'Minimize boolean expressions up to 5 variables with Quine-McCluskey.',
    cta: 'Open K-Map',
    module: 'k-map-visualiser',
  },
  {
    Icon: Workflow,
    title: 'FSM Builder',
    desc: 'Design finite state machines visually and auto-generate ASM charts.',
    cta: 'Open FSM',
    module: 'fsm',
  },
]

export default function QuickStartGuides() {
  const [isPending, startTransition] = useTransition()
  const [activeModule, setActiveModule] = useState<string | null>(null)

  function handleOpen(module: string) {
    setActiveModule(module)
    NProgress.start()
    const formData = new FormData()
    formData.set('module', module)
    startTransition(async () => {
      try {
        await openOrCreateProject(formData)
      } catch {
        NProgress.done()
        setActiveModule(null)
      }
    })
  }

  return (
    <section
      id="quick-start-guides"
      className="w-full px-4 sm:px-6 py-16 sm:py-30 flex flex-col items-center gap-10 relative select-none"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
                  linear-gradient(var(--grid-line) 1px, transparent 1px),
                  linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
                `,
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold pb-2 bg-linear-to-r from-[#8BA4FA] to-[#1E3AC2] bg-clip-text text-transparent tracking-wide text-center break-words">
        Start building in seconds
      </h1>
      <h1 className="text-label-gray text-base sm:text-lg font-bold tracking-wider text-center">
        No setup. No installation. Pick a module and go.
      </h1>
      <div className="w-full flex flex-col md:flex-row items-stretch gap-6 px-4 sm:px-8 lg:px-30 py-6 sm:py-10">
        {cards.map((card) => (
          <div
            key={card.title}
            className="flex-1 group flex flex-col justify-between gap-4 p-6 rounded-xl bg-surface border-2 border-border-theme z-10 hover:border-label transition-colors duration-500"
          >
            <card.Icon size={45} />
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold text-label tracking-wider">
                {card.title}
              </h2>
              <p className="text-lg leading-relaxed">{card.desc}</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleOpen(card.module)}
              className="w-full text-white flex items-center justify-center px-4 py-3 bg-get-started text-xl font-bold gap-2 transition-all duration-500 hover:bg-get-started-hover hover:rounded-2xl cursor-pointer group disabled:opacity-75 disabled:cursor-wait"
            >
              {isPending && activeModule === card.module ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opening...
                </span>
              ) : (
                <>
                  {card.cta}
                  <Image
                    src="/diagonal-arrow.svg"
                    alt="Arrow"
                    width={16}
                    height={16}
                    className="aspect-square"
                  />
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
