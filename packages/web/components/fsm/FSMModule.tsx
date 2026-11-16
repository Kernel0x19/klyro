'use client'
import React from 'react'
import { useFSMStore } from '@/stores/useFSMStore'
import FSMControls from './FSMControls'
import FSMDiagramCanvas from './FSMDiagramCanvas'
import ASMChartCanvas from './ASMChartCanvas'
import StateTablePanel from './StateTablePanel'

interface FSMModuleProps {
  projectId?: string | undefined
  userId?: string | undefined
}

export default function FSMModule({ projectId }: FSMModuleProps) {
  const viewMode = useFSMStore((s) => s.viewMode)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg">
      <FSMControls projectId={projectId} />

      {/* Main visual canvas container */}
      <div id="fsm-export-area" className="flex-1 flex overflow-hidden relative">
        {viewMode === 'diagram' && (
          <div className="flex-1 h-full">
            <FSMDiagramCanvas />
          </div>
        )}

        {viewMode === 'asm' && (
          <div className="flex-1 h-full">
            <ASMChartCanvas />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="flex-1 flex h-full divide-x divide-border-theme">
            <div className="flex-1 h-full relative">
              <div className="absolute top-3 left-4 z-10 px-2 py-0.5 rounded bg-surface/90 border border-border-theme text-[10px] font-mono text-text-secondary select-none">
                State Diagram
              </div>
              <FSMDiagramCanvas />
            </div>
            <div className="flex-1 h-full relative">
              <ASMChartCanvas />
            </div>
          </div>
        )}
      </div>

      {/* State Table & Logic Equations Drawer */}
      <StateTablePanel />
    </div>
  )
}
