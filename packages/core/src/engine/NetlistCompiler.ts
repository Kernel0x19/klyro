/**
 * Klyro — Netlist Compiler
 *
 * Compiles a visual circuit diagram (components and wires) into an electrical netlist,
 * analyzing connectivity, identifying short circuits (multiple drivers contention),
 * and warning on floating inputs or unconnected outputs.
 */

import type { Circuit, PinRef } from '../contracts/Circuit'
import type { ComponentInstance } from '../contracts/Component'
import { componentRegistry } from '../components/registry/ComponentRegistry'

/**
 * An electrical net linking connected pins together into a shared equipotential node.
 */
export interface NetNode {
  /** Identifier of the net (usually the wire ID that established it) */
  id: string
  /** All component pins physically connected to this net */
  connectedPins: PinRef[]
}

/**
 * Component representation within the netlist, mapping each physical pin
 * to its connected net ID.
 */
export interface NetComponent {
  /** Instance identifier of the component */
  instanceId: string
  /** Definition / part number reference (e.g., "74LS08") */
  definitionId: string
  /** Map from pin number to NetNode ID */
  nets: Record<number, string>
}

/**
 * Fatal circuit electrical error.
 */
export interface NetlistError {
  /** Error category: short-circuit (multiple outputs fighting) or unclocked feedback */
  type: 'short-circuit' | 'feedback-without-flipflop'
  /** Human-readable explanation of the electrical fault */
  message: string
  /** Component instance IDs involved in the violation */
  involvedIds: string[]
}

/**
 * Non-fatal advisory warning regarding incomplete or floating connections.
 */
export interface NetlistWarning {
  /** Warning category: floating input (unconnected gate input) */
  type: 'floating-input' | 'unconnected-output'
  /** Human-readable warning message */
  message: string
  /** Specific pin reference experiencing the issue */
  pinRef: PinRef
}

/**
 * Complete compiled netlist output containing nets, components, errors, and warnings.
 */
export interface Netlist {
  nodes: NetNode[]
  components: NetComponent[]
  errors: NetlistError[]
  warnings: NetlistWarning[]
}

/**
 * Compiles high-level Circuit models into verified electrical Netlists.
 */
export class NetlistCompiler {
  /**
   * Compiles the provided Circuit into an electrical Netlist and runs static DRC
   * (Design Rule Checks) for short circuits and floating inputs.
   *
   * @param circuit The circuit schematic to analyze
   * @returns Complete Netlist structure with detected errors and warnings
   */
  compile(circuit: Circuit): Netlist {
    const nodes: NetNode[] = []
    const components: NetComponent[] = []
    const errors: NetlistError[] = []
    const warnings: NetlistWarning[] = []

    // 1. Build Net Nodes from Wire topology
    for (const wire of circuit.wires) {
      nodes.push({
        id: wire.id,
        connectedPins: [wire.sourcePin, ...wire.targetPins],
      })
    }

    // 2. Map Components and their individual pin attachments to Nets
    for (const component of circuit.components) {
      const netComponent: NetComponent = {
        instanceId: component.id,
        definitionId: component.definitionId,
        nets: {},
      }

      for (const wire of circuit.wires) {
        const allPins = [wire.sourcePin, ...wire.targetPins]
        for (const pin of allPins) {
          if (pin.componentId === component.id) {
            netComponent.nets[pin.pinNumber] = wire.id
          }
        }
      }

      components.push(netComponent)
    }

    // 3. DRC Rule: Check for Short Circuits (two or more output pins driving the same net)
    for (const node of nodes) {
      const outputs = node.connectedPins.filter((pin) =>
        this.isPinOutput(pin, circuit)
      )
      if (outputs.length > 1) {
        errors.push({
          type: 'short-circuit',
          message: `Short circuit on net ${node.id}: multiple output drivers connected together`,
          involvedIds: outputs.map((p) => p.componentId),
        })
      }
    }

    // 4. DRC Rule: Check for Floating Inputs (input pins with no incoming connection)
    for (const component of circuit.components) {
      const netComp = components.find((c) => c.instanceId === component.id)
      if (!netComp) continue

      const connectedPins = Object.keys(netComp.nets).map(Number)
      const inputPins = this.getInputPins(component)

      for (const pinNumber of inputPins) {
        if (!connectedPins.includes(pinNumber)) {
          warnings.push({
            type: 'floating-input',
            message: `Floating input on component ${component.id} pin ${pinNumber}`,
            pinRef: { componentId: component.id, pinNumber },
          })
        }
      }
    }

    return { nodes, components, errors, warnings }
  }

  /**
   * Helper: Determines if a given pin reference corresponds to an active output pin.
   */
  private isPinOutput(pin: PinRef, circuit: Circuit): boolean {
    const component = circuit.components.find((c) => c.id === pin.componentId)
    if (!component) return false
    const fn = componentRegistry.getPinFunction(
      component.definitionId,
      pin.pinNumber
    )
    return fn === 'output'
  }

  /**
   * Helper: Retrieves all input and clock pin numbers for a component instance.
   */
  private getInputPins(component: ComponentInstance): number[] {
    return componentRegistry.getInputPins(component.definitionId)
  }
}
