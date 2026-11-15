# @klyro/core

The headless digital logic simulation engine powering Klyro. Built with pure TypeScript with zero DOM or UI dependencies, `@klyro/core` runs in the browser, in Web Workers, in Node.js, and in headless test runners.

---

## Architecture Overview

`@klyro/core` implements an event-driven discrete simulation engine designed for cycle-accurate and propagation-aware TTL logic simulation:

```
               ┌───────────────────────┐
               │    NetlistCompiler    │
               │  (Wiring Graph & Pins)│
               └──────────┬────────────┘
                          │ compiles into
                          ▼
┌──────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
│ Component    │──────▶│    EventScheduler     │──────▶│       EventBus        │
│ Registry     │       │(Discrete Event Queue) │       │(Lifecycle & UI Events)│
└──────────────┘       └───────────────────────┘       └───────────────────────┘
```

### Core Modules

- **Contracts (`src/contracts/`)**:
  - `Signal.ts`: Digital signal states (`HIGH = 1`, `LOW = 0`, `FLOATING = -1`, `UNDEFINED = -2`) and signal transition helpers.
  - `Component.ts`: Abstract base contract for ICs, pin definitions (`PinModel`, `PinDirection`, `PinNumber`), and component metadata.
  - `Circuit.ts`: Circuit container holding placed component instances, external inputs/outputs, and net definitions.
- **Engine (`src/engine/`)**:
  - `EventScheduler.ts`: Priority-queue discrete event scheduler. Propagates pin changes across nets, manages delta cycles, resolves feedback loops, and models propagation delays.
  - `NetlistCompiler.ts`: Compiles user wire connections and IC placements into an indexed evaluation graph.
- **Component Registry (`src/components/registry/`)**:
  - Singleton `ComponentRegistry` managing available IC definitions and lookup by part number (e.g., `74LS00`, `74LS08`, `74LS32`).
- **Event Bus (`src/bus/`)**:
  - Typed pub/sub bus emitting simulation lifecycle events (`SIMULATION_STEP`, `PIN_CHANGE`, `CLOCK_TICK`).

---

## Adding a New IC to Core

To add a new 7400-series TTL component to `@klyro/core`:

### 1. Define the IC Specification

Create or extend an IC definition in `src/components/gates/` (or create a dedicated category file):

```typescript
import type { ComponentDefinition } from '../../contracts/Component'
import { PinDirection } from '../../contracts/Component'
import { SignalState } from '../../contracts/Signal'

export const IC_74LS08: ComponentDefinition = {
  partNumber: '74LS08',
  name: 'Quad 2-Input AND Gate',
  category: 'Basic Gates',
  pinCount: 14,
  pins: [
    { pin: 1, name: '1A', direction: PinDirection.INPUT },
    { pin: 2, name: '1B', direction: PinDirection.INPUT },
    { pin: 3, name: '1Y', direction: PinDirection.OUTPUT },
    { pin: 7, name: 'GND', direction: PinDirection.POWER },
    { pin: 14, name: 'VCC', direction: PinDirection.POWER },
    // ... remaining pins
  ],
  evaluate: (inputs, state) => {
    // Evaluate logic output based on input pin states
    const out1Y = (inputs[1] === SignalState.HIGH && inputs[2] === SignalState.HIGH)
      ? SignalState.HIGH
      : SignalState.LOW

    return { 3: out1Y }
  },
}
```

### 2. Register the Component

Register your new component inside `src/components/registry/registerAllComponents.ts`:

```typescript
import { componentRegistry } from './ComponentRegistry'
import { IC_74LS08 } from '../gates/BasicGates'

export function registerAllComponents(): void {
  componentRegistry.register(IC_74LS08)
}
```

### 3. Add Unit Tests

Add a corresponding test file in `tests/` verifying truth table outputs, edge cases (e.g. floating pins), and propagation behavior.

---

## Development & Scripts

All commands can be run from the repository root using `pnpm --filter @klyro/core <script>` or directly from this folder:

```bash
# Build ESM & CJS bundles + TypeScript declarations (tsup)
pnpm build

# Run tsup in watch mode during engine development
pnpm dev

# Run engine unit tests with Vitest
pnpm test

# Run ESLint across engine source code
pnpm lint
```
