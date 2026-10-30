// Server Component
import HeroActions from './HeroActions'

export default function HeroSection() {
  return (
    <section
      id="hero-section"
      className="relative min-h-[calc(100vh-6rem)] w-full grid place-items-center px-6 py-16 select-none"
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
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-5xl text-center">
        <div className="px-4 py-1 bg-label w-fit cursor-pointer">
          <h1 className="text-2xl font-bold tracking-widest text-white">
            Open Source · Free Forever
          </h1>
        </div>

        <h1 className="text-8xl font-bold bg-linear-to-r from-[#8BA4FA] via-[#4F6EF7] to-[#1E3AC2] bg-clip-text text-transparent tracking-wide">
          Build. Wire. Simulate.
        </h1>

        <h1 className="text-5xl font-bold leading-tight text-center">
          The open-source lab bench for digital logic — right in your browser,
          no hardware required.
        </h1>

        {/* Client component handles navigation buttons */}
        <HeroActions />

        <h1 className="text-base font-bold text-label">
          Also available as a Windows{' '}
          <span className="underline hover:cursor-pointer">Desktop App.</span>
        </h1>
      </div>
    </section>
  )
}
