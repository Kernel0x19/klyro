// Server Component — pure static data, no client-side interactivity
import { Cpu, Grid3x3, Activity, GitFork, Code2, BookOpen } from 'lucide-react'

const features = [
  {
    Icon: Cpu,
    title: 'IC Circuit Board',
    desc: 'Place real 74LS and 74HC series ICs on a virtual breadboard, wire them up, and simulate logic behavior instantly.',
  },
  {
    Icon: Grid3x3,
    title: 'Logic Minimization',
    desc: 'Solve K-Maps up to 5 variables using Quine-McCluskey. Get simplified SOP and POS expressions in one click.',
  },
  {
    Icon: Activity,
    title: 'Waveform Viewer',
    desc: 'Watch timing diagrams update in real time as you simulate your circuit — catch glitches and propagation delays visually.',
  },
  {
    Icon: GitFork,
    title: 'FSM & ASM Charts',
    desc: 'Build finite state machines visually with a drag-and-drop editor, then auto-generate clean ASM flowcharts from your design.',
  },
  {
    Icon: Code2,
    title: 'HDL Export',
    desc: 'Export any circuit or FSM to synthesizable VHDL or Verilog with one click — ready for Quartus or Vivado.',
  },
  {
    Icon: BookOpen,
    title: 'Learning Mode',
    desc: 'Follow step-by-step walkthroughs for every topic, attempt embedded quizzes, and track your progress as you go.',
  },
]

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full px-6 py-30 flex flex-col items-center gap-10 select-none"
    >
      <h1 className="text-6xl font-bold pb-2 bg-linear-to-r from-[#8BA4FA] to-[#1E3AC2] bg-clip-text text-transparent tracking-wide">
        Everything you need to learn Digital Logic
      </h1>
      <h1 className="text-label-gray text-lg font-bold tracking-wider">
        One platform. Real tools. No textbook required.
      </h1>
      <div className="grid grid-cols-2 gap-10 px-55">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group flex flex-col gap-4 p-6 rounded-xl bg-surface border-2 border-border-theme hover:border-label transition-colors duration-500"
          >
            <feature.Icon size={45} />
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold text-label tracking-wider">
                {feature.title}
              </h2>
              <p className="text-lg leading-relaxed">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
