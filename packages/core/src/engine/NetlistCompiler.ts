import type { Circuit, PinRef } from '../contracts/Circuit'
import type { ComponentInstance } from '../contracts/Component'
import { componentRegistry } from '../components/registry/ComponentRegistry'

export interface NetNode {
  id: string
  connectedPins: PinRef[]
}

export interface NetComponent {
  instanceId: string
  definitionId: string
  nets: Record<number, string>
}

export interface NetlistError {
  type: 'short-circuit' | 'feedback-without-flipflop'
  message: string
  involvedIds: string[]
}

export interface NetlistWarning {
  type: 'floating-input' | 'unconnected-output'
  message: string
  pinRef: PinRef
}

export interface Netlist {
  nodes: NetNode[]
  components: NetComponent[]
  errors: NetlistError[]
  warnings: NetlistWarning[]
}

export class NetlistCompiler {
  compile(circuit: Circuit): Netlist {
    const nodes: NetNode[] = []
    const components: NetComponent[] = []
    const errors: NetlistError[] = []
    const warnings: NetlistWarning[] = []

    for (const wire of circuit.wires) {
      nodes.push({
        id: wire.id,
        connectedPins: [wire.sourcePin, ...wire.targetPins],
      })
    }

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

    for (const node of nodes) {
      const outputs = node.connectedPins.filter((pin) =>
        this.isPinOutput(pin, circuit)
      )
      if (outputs.length > 1) {
        errors.push({
          type: 'short-circuit',
          message: `Short circuit on net ${node.id}`,
          involvedIds: outputs.map((p) => p.componentId),
        })
      }
    }

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

  private isPinOutput(pin: PinRef, circuit: Circuit): boolean {
    const component = circuit.components.find((c) => c.id === pin.componentId)
    if (!component) return false
    const fn = componentRegistry.getPinFunction(
      component.definitionId,
      pin.pinNumber
    )
    return fn === 'output'
  }

  private getInputPins(component: ComponentInstance): number[] {
    return componentRegistry.getInputPins(component.definitionId)
  }
}