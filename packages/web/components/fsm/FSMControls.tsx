'use client'
import React, { useState } from 'react'
import { useFSMStore } from '@/stores/useFSMStore'
import { FSM_PRESETS } from '@/lib/fsm/fsmPresets'
import { exportReactFlowToPng } from '@/lib/fsm/fsmExport'
import { generateASMChart } from '@/lib/fsm/asmGenerator'
import {
  Plus,
  Play,
  RotateCcw,
  Download,
  LayoutGrid,
  GitBranch,
  Columns,
  Sparkles,
} from 'lucide-react'

interface FSMControlsProps {
  projectId?: string | undefined
}

export default function FSMControls({ projectId }: FSMControlsProps) {
  const machineType = useFSMStore((s) => s.machineType)
  const setMachineType = useFSMStore((s) => s.setMachineType)
  const viewMode = useFSMStore((s) => s.viewMode)
  const setViewMode = useFSMStore((s) => s.setViewMode)
  const addState = useFSMStore((s) => s.addState)
  const states = useFSMStore((s) => s.states)
  const transitions = useFSMStore((s) => s.transitions)
  const inputs = useFSMStore((s) => s.inputs)
  const outputs = useFSMStore((s) => s.outputs)
  const encodings = useFSMStore((s) => s.encodings)
  const addInput = useFSMStore((s) => s.addInput)
  const inputValues = useFSMStore((s) => s.inputValues)
  const setInputValue = useFSMStore((s) => s.setInputValue)
  const stepClock = useFSMStore((s) => s.stepClock)
  const resetSimulation = useFSMStore((s) => s.resetSimulation)
  const loadPreset = useFSMStore((s) => s.loadPreset)
  const arrangeSymmetrical = useFSMStore((s) => s.arrangeSymmetrical)
  const reset = useFSMStore((s) => s.reset)

  const [newInpName, setNewInpName] = useState('')
  const [showAddInp, setShowAddInp] = useState(false)

  async function handleExportPNG() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
    const namePrefix = projectId ? `klyro-fsm-${projectId}` : 'klyro-fsm'

    try {
      if (viewMode === 'diagram' || viewMode === 'split') {
        const diagramEl = document.getElementById('fsm-diagram-canvas')
        if (diagramEl) {
          const nodes = states.map((s) => ({
            position: { x: s.x, y: s.y },
            width: 96,
            height: 96,
          }))
          await exportReactFlowToPng(
            diagramEl,
            nodes,
            viewMode === 'split' ? `${namePrefix}-diagram.png` : `${namePrefix}.png`,
            isDark
          )
        }
      }

      if (viewMode === 'asm' || viewMode === 'split') {
        const asmEl = document.getElementById('fsm-asm-canvas')
        if (asmEl) {
          const { blocks } = generateASMChart(
            states,
            transitions,
            inputs,
            outputs,
            machineType,
            encodings
          )
          const nodes = blocks.map((b) => ({
            position: { x: b.x, y: b.y },
            width: b.type === 'state' ? 180 : b.type === 'decision' ? 130 : 120,
            height: b.type === 'state' ? 70 : b.type === 'decision' ? 90 : 60,
          }))
          await exportReactFlowToPng(
            asmEl,
            nodes,
            viewMode === 'split' ? `${namePrefix}-asm.png` : `${namePrefix}.png`,
            isDark
          )
        }
      }
    } catch (err) {
      console.error('FSM PNG export failed:', err)
    }
  }

  function handleCreateInput() {
    if (newInpName.trim()) {
      addInput(newInpName)
      setNewInpName('')
      setShowAddInp(false)
    }
  }


  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border-theme shrink-0 bg-surface flex-wrap font-mono text-xs">
      {/* 1. Machine Model Toggle: Mealy / Moore */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Model</span>
        <div className="flex rounded bg-neutral-800 p-0.5 border border-neutral-700">
          <button
            onClick={() => setMachineType('mealy')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              machineType === 'mealy' ? 'bg-[#4F6EF7] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Mealy
          </button>
          <button
            onClick={() => setMachineType('moore')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              machineType === 'moore' ? 'bg-[#4F6EF7] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Moore
          </button>
        </div>
      </div>

      <div className="w-px h-5 bg-border-theme" />

      {/* 2. View Mode Switcher: Diagram / ASM / Split */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">View</span>
        <div className="flex rounded bg-neutral-800 p-0.5 border border-neutral-700">
          <button
            onClick={() => setViewMode('diagram')}
            title="State Diagram Canvas"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              viewMode === 'diagram' ? 'bg-[#4F6EF7] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <GitBranch size={12} />
            Diagram
          </button>
          <button
            onClick={() => setViewMode('asm')}
            title="Algorithmic State Machine Chart"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              viewMode === 'asm' ? 'bg-[#4F6EF7] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={12} />
            ASM Chart
          </button>
          <button
            onClick={() => setViewMode('split')}
            title="Side-by-Side Split View"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              viewMode === 'split' ? 'bg-[#4F6EF7] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Columns size={12} />
            Split
          </button>
        </div>
      </div>

      <div className="w-px h-5 bg-border-theme" />

      {/* 3. Preset selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Preset</span>
        <select
          onChange={(e) => e.target.value && loadPreset(e.target.value)}
          defaultValue="seq-101"
          className="h-7 px-2 text-[11px] bg-neutral-800 border border-neutral-700 rounded text-text-primary outline-none cursor-pointer"
        >
          {FSM_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-px h-5 bg-border-theme" />

      {/* 4. Inputs & Values for Stepping */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Inputs:</span>
        <div className="flex items-center gap-1">
          {inputs.map((inp) => {
            const val = inputValues[inp] ?? 0
            return (
              <button
                key={inp}
                onClick={() => setInputValue(inp, val === 1 ? 0 : 1)}
                title={`Toggle input ${inp} (Current: ${val})`}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                  val === 1
                    ? 'bg-blue-500/20 text-[#4F6EF7] border-[#4F6EF7]/40'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {inp}={val}
              </button>
            )
          })}
          {showAddInp ? (
            <div className="flex items-center gap-1">
              <input
                value={newInpName}
                onChange={(e) => setNewInpName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateInput()}
                placeholder="Name"
                className="w-12 h-6 px-1 text-[10px] bg-bg border border-border-theme rounded outline-none"
                autoFocus
              />
              <button
                onClick={handleCreateInput}
                className="text-[10px] text-green-400 hover:text-green-300 font-bold"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddInp(true)}
              title="Add Input Variable"
              className="w-5 h-5 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
            >
              <Plus size={11} />
            </button>
          )}
        </div>
      </div>

      <div className="w-px h-5 bg-border-theme" />

      {/* 5. Live Simulation Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={stepClock}
          title="Pulse Clock to trigger state transition"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#4F6EF7] hover:bg-[#3D5CE5] text-white font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
        >
          <Play size={11} className="fill-white" />
          Pulse Clock
        </button>
        <button
          onClick={resetSimulation}
          title="Reset simulation to initial state"
          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* 6. Action Buttons Right */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={arrangeSymmetrical}
          title="Auto-arrange states symmetrically in a circle"
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded transition-colors cursor-pointer"
        >
          <Sparkles size={12} />
          Symmetrical Layout
        </button>
        <button
          onClick={() => addState()}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-green-600 hover:bg-green-500 rounded transition-colors cursor-pointer"
        >
          <Plus size={12} />
          State
        </button>
        <button
          onClick={handleExportPNG}
          title="Export diagram as PNG"
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-text-primary rounded hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Download size={12} />
          Export PNG
        </button>
        <button
          onClick={reset}
          title="Reset FSM"
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-red-400 rounded hover:bg-red-400/10 transition-colors cursor-pointer"
        >
          <RotateCcw size={12} />
          Clear
        </button>
      </div>
    </div>
  )
}
