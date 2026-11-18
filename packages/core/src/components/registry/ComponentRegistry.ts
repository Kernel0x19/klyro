/**
 * Klyro — Component Registry
 *
 * Centralized, singleton registry providing lookup, introspection, and pin classification
 * for all supported digital logic ICs and gate families.
 */

import type {
  ComponentDefinition,
  ComponentCategory,
  PinFunction,
} from '../../contracts/Component'

/**
 * Registry storing component metadata indexed by official part number.
 */
class KlyroComponentRegistry {
  private definitions = new Map<string, ComponentDefinition>()

  /**
   * Registers a new IC definition into the global catalog.
   *
   * @param definition The full IC specification and pinout
   */
  register(definition: ComponentDefinition): void {
    this.definitions.set(definition.partNumber, definition)
  }

  /**
   * Retrieves an IC definition by its standard part number (e.g. "74LS08").
   *
   * @param partNumber The industry part number
   * @returns The ComponentDefinition if registered, else undefined
   */
  get(partNumber: string): ComponentDefinition | undefined {
    return this.definitions.get(partNumber)
  }

  /**
   * Returns an array of all currently registered IC definitions.
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values())
  }

  /**
   * Filters registered ICs by functional category (e.g., 'basic-gate', 'flip-flop', 'counter').
   *
   * @param category The component category
   */
  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    return this.getAll().filter((d) => d.category === category)
  }

  /**
   * Returns a list of pin numbers that function as inputs or clocks for a given IC.
   *
   * @param partNumber The industry part number
   * @returns Array of 1-based pin numbers
   */
  getInputPins(partNumber: string): number[] {
    const def = this.get(partNumber)
    if (!def) return []
    return def.pins
      .filter((p) => p.function === 'input' || p.function === 'clock')
      .map((p) => p.number)
  }

  /**
   * Returns a list of pin numbers that function as active signal outputs for a given IC.
   *
   * @param partNumber The industry part number
   * @returns Array of 1-based pin numbers
   */
  getOutputPins(partNumber: string): number[] {
    const def = this.get(partNumber)
    if (!def) return []
    return def.pins
      .filter((p) => p.function === 'output')
      .map((p) => p.number)
  }

  /**
   * Determines the electrical/functional role of a specific pin on an IC.
   *
   * @param partNumber The industry part number
   * @param pinNumber The physical 1-based pin number
   * @returns PinFunction ('input', 'output', 'clock', 'vcc', 'gnd', 'nc') or undefined
   */
  getPinFunction(partNumber: string, pinNumber: number): PinFunction | undefined {
    const def = this.get(partNumber)
    if (!def) return undefined
    return def.pins.find((p) => p.number === pinNumber)?.function
  }

  /**
   * Checks whether a given part number has been loaded into the registry.
   */
  isRegistered(partNumber: string): boolean {
    return this.definitions.has(partNumber)
  }
}

/** Singleton instance used across core engine and web simulation */
export const componentRegistry = new KlyroComponentRegistry()
export type { KlyroComponentRegistry }
