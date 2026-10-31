// Server Component — pure static footer with Next.js Link
import Link from 'next/link'
import Image from 'next/image'
import { openOrCreateProject } from '@/lib/supabase/projects'

const links = {
  Product: [
    { label: 'IC Circuit Board', module: 'board' },
    { label: 'K-Map Solver', module: 'k-map-visualiser' },
    { label: 'FSM Builder', module: 'fsm' },
  ],
  Resources: [
    { label: 'Docs', href: '/docs' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'GitHub', href: 'https://github.com/Kernel0x19/klyro' },
    { label: 'Desktop App', href: '/download' },
    { label: 'Plugin API', href: '/docs/plugins' },
  ],
  Project: [
    { label: 'About', href: '/about' },
    { label: 'Contribute', href: '/docs/contributing' },
    { label: 'License', href: '/license' },
  ],
}

export default function Footer() {
  return (
    <footer className="w-full border-t-2 border-border-theme bg-bg relative select-none">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 0%, transparent 100%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-16 flex flex-col gap-12">
        <div className="flex flex-wrap justify-between gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-3 max-w-xs">
            <a href="#" className="flex items-center gap-2.5 cursor-pointer">
              <Image
                src="/favicon.svg"
                alt="Klyro-Logo"
                width={40}
                height={40}
                className="aspect-square"
              />
              <div className="flex gap-1.5 items-baseline">
                <h1 className="text-2xl font-extrabold">Klyro</h1>
                <h1 className="text-xs font-extrabold">v0.1.0</h1>
              </div>
            </a>
            <p className="text-sm text-text-secondary leading-relaxed">
              The open-source lab bench for digital logic — right in your
              browser, no hardware required.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://github.com/Kernel0x19/klyro"
                className="text-text-secondary hover:text-[#5B68E8] transition-colors"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/github-logo.svg"
                  alt="Github-Logo"
                  width={20}
                  height={20}
                  className="aspect-square"
                />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-16">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-label tracking-wider uppercase">
                Product
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.Product.map((item) => (
                  <li key={item.label}>
                    <form action={openOrCreateProject}>
                      <input type="hidden" name="module" value={item.module} />
                      <button
                        type="submit"
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-16">
              {(['Resources', 'Project'] as const).map((heading) => (
                <div key={heading} className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-label tracking-wider uppercase">
                    {heading}
                  </h3>
                  <ul className="flex flex-col gap-2.5">
                    {links[heading].map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border-theme">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} Klyro. Open source, free forever.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/license"
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              MIT License
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
