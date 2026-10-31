import { Cpu, Grid3x3, Workflow } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const cards = [
  {
    Icon: Cpu,
    title: 'IC Circuit Board',
    desc: 'Place real 74LS and 74HC series ICs on a virtual breadboard and wire them up.',
    cta: 'Open Board',
    href: '/editor?module=board',
  },
  {
    Icon: Grid3x3,
    title: 'K-Map Solver',
    desc: 'Minimize boolean expressions up to 5 variables with Quine-McCluskey.',
    cta: 'Open K-Map',
    href: '/editor?module=k-map-visualiser',
  },
  {
    Icon: Workflow,
    title: 'FSM Builder',
    desc: 'Design finite state machines visually and auto-generate ASM charts.',
    cta: 'Open FSM',
    href: '/editor?module=fsm',
  },
]

export default function QuickStartGuides() {
  return (
    <section
      id="quick-start-guides"
      className="w-full px-6 py-30 flex flex-col items-center gap-10 relative select-none"
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
      <h1 className="text-6xl font-bold pb-2 bg-linear-to-r from-[#8BA4FA] to-[#1E3AC2] bg-clip-text text-transparent tracking-wide">
        Start building in seconds
      </h1>
      <h1 className="text-label-gray text-lg font-bold tracking-wider">
        No setup. No installation. Pick a module and go.
      </h1>
      <div className="w-full flex items-center gap-6 px-30 py-10">
        {cards.map((card) => (
          <div
            key={card.title}
            className="group flex flex-col gap-4 p-6 rounded-xl bg-surface border-2 border-border-theme z-10 hover:border-label transition-colors duration-500"
          >
            <card.Icon size={45} />
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold text-label tracking-wider">
                {card.title}
              </h2>
              <p className="text-lg leading-relaxed">{card.desc}</p>
            </div>
            <Link
              href={card.href}
              className="text-white flex items-center justify-center px-4 py-3 bg-get-started text-xl font-bold gap-2 transition-all duration-500 hover:bg-get-started-hover hover:rounded-2xl cursor-pointer group"
            >
              {card.cta}
              <Image
                src="/diagonal-arrow.svg"
                alt="Arrow"
                width={16}
                height={16}
                className="aspect-square"
              />
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
