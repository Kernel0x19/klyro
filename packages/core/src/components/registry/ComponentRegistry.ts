// Klyro — Component Registry
// Central registry for all IC and gate definitions

import type {
  ComponentDefinition,
  ComponentCategory,
  PinFunction,
} from '../../contracts/Component'

class KlyroComponentRegistry {
  private definitions = new Map<string, ComponentDefinition>()

  register(definition: ComponentDefinition): void {
    this.definitions.set(definition.partNumber, definition)
  }

  get(partNumber: string): ComponentDefinition | undefined {
    return this.definitions.get(partNumber)
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values())
  }

  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    return this.getAll().filter((d) => d.category === category)
  }

  getInputPins(partNumber: string): number[] {
    const def = this.get(partNumber)
    if (!def) return []
    return def.pins
      .filter((p) => p.function === 'input' || p.function === 'clock')
      .map((p) => p.number)
  }

  getOutputPins(partNumber: string): number[] {
    const def = this.get(partNumber)
    if (!def) return []
    return def.pins
      .filter((p) => p.function === 'output')
      .map((p) => p.number)
  }

  getPinFunction(partNumber: string, pinNumber: number): PinFunction | undefined {
    const def = this.get(partNumber)
    if (!def) return undefined
    return def.pins.find((p) => p.number === pinNumber)?.function
  }

  isRegistered(partNumber: string): boolean {
    return this.definitions.has(partNumber)
  }
}

// Singleton
export const componentRegistry = new KlyroComponentRegistry()
export type { KlyroComponentRegistry }