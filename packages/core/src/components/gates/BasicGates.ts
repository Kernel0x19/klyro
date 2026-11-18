/**
 * Klyro — Basic Gate IC Definitions
 *
 * Provides physical pin mappings, internal gate configurations, propagation
 * delays, and datasheet references for standard 74LS series dual-in-line
 * logic ICs (74LS00, 74LS08, 74LS32).
 */

import type { ComponentDefinition } from '../../contracts/Component'

/**
 * 74LS08: Quadruple 2-Input Positive-AND Gates
 * - 4 independent 2-input AND gates
 * - Typical propagation delay: 9 ns
 * - Package: DIP-14
 * - Power: Pin 14 (VCC), Pin 7 (GND)
 */
export const IC_74LS08: ComponentDefinition = {
  partNumber: '74LS08',
  name: 'Quad 2-Input AND Gate',
  category: 'basic-gate',
  packageType: 'DIP14',
  totalPins: 14,
  vccPin: 14,
  gndPin: 7,
  propagationDelay: 9,
  logicFamily: 'LSTTL',
  starred: false,
  pins: [
    { number: 1, label: '1A', function: 'input', gateUnit: 1 },
    { number: 2, label: '1B', function: 'input', gateUnit: 1 },
    { number: 3, label: '1Y', function: 'output', gateUnit: 1 },
    { number: 4, label: '2A', function: 'input', gateUnit: 2 },
    { number: 5, label: '2B', function: 'input', gateUnit: 2 },
    { number: 6, label: '2Y', function: 'output', gateUnit: 2 },
    { number: 7, label: 'GND', function: 'gnd' },
    { number: 8, label: '3Y', function: 'output', gateUnit: 3 },
    { number: 9, label: '3A', function: 'input', gateUnit: 3 },
    { number: 10, label: '3B', function: 'input', gateUnit: 3 },
    { number: 11, label: '4Y', function: 'output', gateUnit: 4 },
    { number: 12, label: '4A', function: 'input', gateUnit: 4 },
    { number: 13, label: '4B', function: 'input', gateUnit: 4 },
    { number: 14, label: 'VCC', function: 'vcc' },
  ],
  internalGates: [
    { unitId: 1, type: 'AND', inputPins: [1, 2], outputPin: 3 },
    { unitId: 2, type: 'AND', inputPins: [4, 5], outputPin: 6 },
    { unitId: 3, type: 'AND', inputPins: [9, 10], outputPin: 8 },
    { unitId: 4, type: 'AND', inputPins: [12, 13], outputPin: 11 },
  ],
  datasheetUrl: 'https://www.ti.com/lit/ds/symlink/sn74ls08.pdf',
}

/**
 * 74LS00: Quadruple 2-Input Positive-NAND Gates
 * - 4 independent 2-input NAND gates
 * - Typical propagation delay: 9 ns
 * - Package: DIP-14
 * - Power: Pin 14 (VCC), Pin 7 (GND)
 */
export const IC_74LS00: ComponentDefinition = {
  partNumber: '74LS00',
  name: 'Quad 2-Input NAND Gate',
  category: 'basic-gate',
  packageType: 'DIP14',
  totalPins: 14,
  vccPin: 14,
  gndPin: 7,
  propagationDelay: 9,
  logicFamily: 'LSTTL',
  starred: false,
  pins: [
    { number: 1, label: '1A', function: 'input', gateUnit: 1 },
    { number: 2, label: '1B', function: 'input', gateUnit: 1 },
    { number: 3, label: '1Y', function: 'output', gateUnit: 1 },
    { number: 4, label: '2A', function: 'input', gateUnit: 2 },
    { number: 5, label: '2B', function: 'input', gateUnit: 2 },
    { number: 6, label: '2Y', function: 'output', gateUnit: 2 },
    { number: 7, label: 'GND', function: 'gnd' },
    { number: 8, label: '3Y', function: 'output', gateUnit: 3 },
    { number: 9, label: '3A', function: 'input', gateUnit: 3 },
    { number: 10, label: '3B', function: 'input', gateUnit: 3 },
    { number: 11, label: '4Y', function: 'output', gateUnit: 4 },
    { number: 12, label: '4A', function: 'input', gateUnit: 4 },
    { number: 13, label: '4B', function: 'input', gateUnit: 4 },
    { number: 14, label: 'VCC', function: 'vcc' },
  ],
  internalGates: [
    { unitId: 1, type: 'NAND', inputPins: [1, 2], outputPin: 3 },
    { unitId: 2, type: 'NAND', inputPins: [4, 5], outputPin: 6 },
    { unitId: 3, type: 'NAND', inputPins: [9, 10], outputPin: 8 },
    { unitId: 4, type: 'NAND', inputPins: [12, 13], outputPin: 11 },
  ],
  datasheetUrl: 'https://www.ti.com/lit/ds/symlink/sn74ls00.pdf',
}

/**
 * 74LS32: Quadruple 2-Input Positive-OR Gates
 * - 4 independent 2-input OR gates
 * - Typical propagation delay: 14 ns
 * - Package: DIP-14
 * - Power: Pin 14 (VCC), Pin 7 (GND)
 */
export const IC_74LS32: ComponentDefinition = {
  partNumber: '74LS32',
  name: 'Quad 2-Input OR Gate',
  category: 'basic-gate',
  packageType: 'DIP14',
  totalPins: 14,
  vccPin: 14,
  gndPin: 7,
  propagationDelay: 14,
  logicFamily: 'LSTTL',
  starred: false,
  pins: [
    { number: 1, label: '1A', function: 'input', gateUnit: 1 },
    { number: 2, label: '1B', function: 'input', gateUnit: 1 },
    { number: 3, label: '1Y', function: 'output', gateUnit: 1 },
    { number: 4, label: '2A', function: 'input', gateUnit: 2 },
    { number: 5, label: '2B', function: 'input', gateUnit: 2 },
    { number: 6, label: '2Y', function: 'output', gateUnit: 2 },
    { number: 7, label: 'GND', function: 'gnd' },
    { number: 8, label: '3Y', function: 'output', gateUnit: 3 },
    { number: 9, label: '3A', function: 'input', gateUnit: 3 },
    { number: 10, label: '3B', function: 'input', gateUnit: 3 },
    { number: 11, label: '4Y', function: 'output', gateUnit: 4 },
    { number: 12, label: '4A', function: 'input', gateUnit: 4 },
    { number: 13, label: '4B', function: 'input', gateUnit: 4 },
    { number: 14, label: 'VCC', function: 'vcc' },
  ],
  internalGates: [
    { unitId: 1, type: 'OR', inputPins: [1, 2], outputPin: 3 },
    { unitId: 2, type: 'OR', inputPins: [4, 5], outputPin: 6 },
    { unitId: 3, type: 'OR', inputPins: [9, 10], outputPin: 8 },
    { unitId: 4, type: 'OR', inputPins: [12, 13], outputPin: 11 },
  ],
  datasheetUrl: 'https://www.ti.com/lit/ds/symlink/sn74ls32.pdf',
}

