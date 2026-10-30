// Server Component — static IC list with CSS marquee animation (defined in globals.css)
const ics = [
  '74HC191',
  '74HC194',
  '74LS00',
  '74LS02',
  '74LS03',
  '74LS04',
  '74LS08',
  '74LS10',
  '74LS11',
  '74LS14',
  '74LS20',
  '74LS21',
  '74LS27',
  '74LS30',
  '74LS32',
  '74LS38',
  '74LS74',
  '74LS76',
  '74LS83',
  '74LS85',
  '74LS86',
  '74LS90',
  '74LS93',
  '74LS138',
  '74LS139',
  '74LS151',
  '74LS153',
  '74LS191',
  '74LS194',
]

export default function ICLibraryPreview() {
  const strip = [...ics, ...ics]

  return (
    <section
      id="ic-library"
      className="w-full px-6 py-30 flex flex-col items-center gap-10 relative select-none"
    >
      <h1 className="text-6xl font-bold pb-2 bg-linear-to-r from-[#8BA4FA] to-[#1E3AC2] bg-clip-text text-transparent tracking-wide">
        {ics.length}+ Real ICs Built In
      </h1>
      <h1 className="text-label-gray text-lg font-bold tracking-wider">
        From basic gates to counters, decoders and shift registers
      </h1>

      <div className="w-full px-30 py-10 z-50">
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}
        >
          <div className="flex gap-3 w-max animate-marquee">
            {strip.map((part, i) => (
              <div
                key={`${part}-${i}`}
                className="shrink-0 px-5 py-4 rounded-xl bg-surface border-2 border-label"
              >
                <span className="text-base font-mono text-text-secondary tracking-wide">
                  {part}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-neutral-500 text-sm mt-6 text-center">
          <h1 className="text-base font-bold text-label">
            Plugin support for custom ICs
          </h1>
        </div>
      </div>
    </section>
  )
}
