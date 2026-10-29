// Klyro — Component Bootstrap
// Registers all built-in IC definitions into the registry

import { componentRegistry } from './ComponentRegistry'
import {
  IC_74LS00,
  IC_74LS08,
  IC_74LS32,
} from '../gates/BasicGates'

export function registerAllComponents(): void {
  // Basic Gates
  componentRegistry.register(IC_74LS00)
  componentRegistry.register(IC_74LS08)
  componentRegistry.register(IC_74LS32)
}