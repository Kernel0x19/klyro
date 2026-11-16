'use client'
import React, { useState, useEffect } from 'react'
import { useFSMStore } from '@/stores/useFSMStore'
import { X, Trash2 } from 'lucide-react'

interface EditStateModalProps {
  stateId: string | null
  onClose: () => void
}

export default function EditStateModal({ stateId, onClose }: EditStateModalProps) {
  const states = useFSMStore((s) => s.states)
  const outputs = useFSMStore((s) => s.outputs)
  const machineType = useFSMStore((s) => s.machineType)
  const updateState = useFSMStore((s) => s.updateState)
  const removeState = useFSMStore((s) => s.removeState)
  const setInitialState = useFSMStore((s) => s.setInitialState)

  const state = states.find((s) => s.id === stateId)

  const [name, setName] = useState('')
  const [isInitial, setIsInitial] = useState(false)
  const [mooreOutputs, setMooreOutputs] = useState<Record<string, 0 | 1>>({})

  useEffect(() => {
    if (state) {
      setName(state.name)
      setIsInitial(state.isInitial)
      setMooreOutputs({ ...state.mooreOutputs })
    }
  }, [state])

  if (!stateId || !state) return null

  function handleSave() {
    if (!stateId) return
    updateState(stateId, {
      name: name.trim() || state!.name,
      mooreOutputs,
    })
    if (isInitial && !state!.isInitial) {
      setInitialState(stateId)
    }
    onClose()
  }

  function handleDelete() {
    if (!stateId) return
    removeState(stateId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-surface border border-border-theme rounded-lg shadow-xl w-full max-w-sm p-5 font-mono">
        <div className="flex items-center justify-between border-b border-border-theme pb-3 mb-4">
          <h2 className="text-sm font-bold text-text-primary">Edit State</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-text-primary p-1 rounded hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">State Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. S0, IDLE"
              className="w-full h-8 px-2.5 text-xs bg-bg border border-border-theme rounded focus:border-[#4F6EF7] outline-none text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="initial-state-chk"
              checked={isInitial}
              onChange={(e) => setIsInitial(e.target.checked)}
              className="accent-[#4F6EF7] rounded"
            />
            <label htmlFor="initial-state-chk" className="text-xs text-text-secondary select-none cursor-pointer">
              Set as Initial / Reset State
            </label>
          </div>

          {machineType === 'moore' && outputs.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">
                Moore Outputs (Active in this state)
              </label>
              <div className="flex flex-wrap gap-2">
                {outputs.map((out) => {
                  const val = mooreOutputs[out] ?? 0
                  return (
                    <button
                      key={out}
                      type="button"
                      onClick={() =>
                        setMooreOutputs((prev) => ({
                          ...prev,
                          [out]: val === 1 ? 0 : 1,
                        }))
                      }
                      className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                        val === 1
                          ? 'bg-green-500/20 text-green-400 border-green-500/40'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {out}: {val}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 pt-3 border-t border-border-theme">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors p-1"
          >
            <Trash2 size={14} />
            Delete State
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1.5 text-xs font-bold bg-[#4F6EF7] hover:bg-[#3D5CE5] text-white rounded transition-colors shadow-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
