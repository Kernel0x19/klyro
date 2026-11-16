'use client'
import React, { useState, useEffect } from 'react'
import { useFSMStore } from '@/stores/useFSMStore'
import { X, Trash2 } from 'lucide-react'

interface EditTransitionModalProps {
  transitionId: string | null
  onClose: () => void
}

export default function EditTransitionModal({ transitionId, onClose }: EditTransitionModalProps) {
  const transitions = useFSMStore((s) => s.transitions)
  const states = useFSMStore((s) => s.states)
  const inputs = useFSMStore((s) => s.inputs)
  const outputs = useFSMStore((s) => s.outputs)
  const machineType = useFSMStore((s) => s.machineType)
  const updateTransition = useFSMStore((s) => s.updateTransition)
  const removeTransition = useFSMStore((s) => s.removeTransition)

  const transition = transitions.find((t) => t.id === transitionId)
  const fromState = states.find((s) => s.id === transition?.fromState)
  const toState = states.find((s) => s.id === transition?.toState)

  const [condition, setCondition] = useState('')
  const [mealyOutputs, setMealyOutputs] = useState<Record<string, 0 | 1>>({})

  useEffect(() => {
    if (transition) {
      setCondition(transition.condition)
      setMealyOutputs({ ...transition.mealyOutputs })
    }
  }, [transition])

  if (!transitionId || !transition) return null

  function handleSave() {
    if (!transitionId) return
    updateTransition(transitionId, {
      condition: condition.trim() || '1',
      mealyOutputs,
    })
    onClose()
  }

  function handleDelete() {
    if (!transitionId) return
    removeTransition(transitionId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-surface border border-border-theme rounded-lg shadow-xl w-full max-w-sm p-5 font-mono">
        <div className="flex items-center justify-between border-b border-border-theme pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Edit Transition</h2>
            <p className="text-[10px] text-text-secondary mt-0.5">
              {fromState?.name ?? 'S?'} &rarr; {toState?.name ?? 'S?'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-text-primary p-1 rounded hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-text-secondary">Condition Expression</label>
              <span className="text-[10px] text-neutral-500">e.g. X=1, !X, or 1</span>
            </div>
            <input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. X=1"
              className="w-full h-8 px-2.5 text-xs bg-bg border border-border-theme rounded focus:border-[#4F6EF7] outline-none text-text-primary"
            />
            {/* Quick condition chips for active inputs */}
            {inputs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {inputs.map((inp) => (
                  <React.Fragment key={inp}>
                    <button
                      type="button"
                      onClick={() => setCondition(`${inp}=1`)}
                      className="text-[10px] px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
                    >
                      {inp}=1
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition(`${inp}=0`)}
                      className="text-[10px] px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
                    >
                      {inp}=0
                    </button>
                  </React.Fragment>
                ))}
                <button
                  type="button"
                  onClick={() => setCondition('1')}
                  className="text-[10px] px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
                >
                  1 (Always)
                </button>
              </div>
            )}
          </div>

          {machineType === 'mealy' && outputs.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">
                Mealy Outputs (Active on this transition)
              </label>
              <div className="flex flex-wrap gap-2">
                {outputs.map((out) => {
                  const val = mealyOutputs[out] ?? 0
                  return (
                    <button
                      key={out}
                      type="button"
                      onClick={() =>
                        setMealyOutputs((prev) => ({
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
            Delete
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
