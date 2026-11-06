# Changelog

All notable changes to the **Klyro** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - v0.2.0 (In Progress)

The `v0.2.0` milestone focuses on full simulation coverage for all 31 ICs in the library, introducing dedicated combinational evaluators, a sequential clock-edge engine, counter state machines, universal shift registers, and active clock pulses.

### Target: All 31 ICs Simulate Correctly

#### Combinational IC Evaluators
- **74LS83**: 4-bit binary full adder with fast internal carry lookahead/propagation.
- **74LS85**: 4-bit magnitude comparator ($A > B$, $A < B$, $A = B$) with cascading inputs.
- **74LS138**: 3-to-8 line decoder / demultiplexer with 3 enable pins ($G_1$, $\overline{G}_{2A}$, $\overline{G}_{2B}$).
- **74LS139**: Dual 2-to-4 line decoder / demultiplexer with individual active-low enables.
- **74LS151**: 8-to-1 data selector / multiplexer with strobe and complementary ($Y$, $W$) outputs.
- **74LS153**: Dual 4-to-1 data selector / multiplexer with separate select and enable inputs.

#### Sequential IC Engine
- Clock edge transition detector (rising $\uparrow$ and falling $\downarrow$ edge detection).
- **74LS74**: Dual D-type positive-edge-triggered flip-flops with asynchronous preset ($\overline{PRE}$) and clear ($\overline{CLR}$).
- **74LS76**: Dual JK flip-flops with preset and clear (master-slave architecture).

#### Counter State Machines
- **74LS90**: Asynchronous BCD decade counter (independent divide-by-2 and divide-by-5 sections).
- **74LS93**: 4-bit binary counter (independent divide-by-2 and divide-by-8 sections).
- **74HC191 / 74LS191**: Synchronous 4-bit reversible up/down counters with mode and enable controls.

#### Universal Shift Register Modes
- **74HC194 / 74LS194**: 4-bit bidirectional universal shift registers with full mode support:
  - SISO (Serial-In, Serial-Out)
  - SIPO (Serial-In, Parallel-Out)
  - PISO (Parallel-In, Serial-Out)
  - PIPO (Parallel-In, Parallel-Out)
  - Parallel load and asynchronous master reset.

#### Active Clock Driver
- Functional clock generator: frequency selector (0.5 Hz, 1 Hz, 5 Hz, 10 Hz) driving periodic clock pulses to sequential ICs.
- `GENERATE PULSE` button triggering a clean single rising-edge pulse for single-step debugging.

---

## [0.1.4] - 2026-11-06

### Added
- **Functional Editor Tool Switcher**:
  - Implemented working tools in sidebar: **Select** (`V`), **Wire** (`W`), **Pan** (`H`), and **Delete** (`D`).
  - Restricted canvas panning strictly to the Pan tool (`panOnDrag`), preventing unintentional canvas shifts during wiring and IC selection.
  - Restricted wire creation strictly to the Wire tool (`nodesConnectable`), disabling pin handles in other modes.
  - Added click-to-delete for wires and IC slots, with automatic cleanup of all connected wires on IC removal.
  - Added visual hover feedback for Delete mode: 16px wide interaction stroke, red dashed line with drop-shadow glow for wires, and red highlight with remove badge for ICs.
  - Added keyboard shortcuts (<kbd>V</kbd>, <kbd>W</kbd>, <kbd>H</kbd>, <kbd>D</kbd>) and dynamic bottom panel tool hints.

### Fixed
- **Navbar Scroll Persistence**: Removed legacy `klyro_scrolled` from `sessionStorage` in `NavbarClient.tsx` that caused the navbar to incorrectly load in a detached/floating state when returning to the top of the homepage from other pages.

---

## [0.1.3] - 2026-11-06

### Fixed
- **App Version Resolution**: Resolved `.env.local` priority shadowing in Next.js build using `@next/env` to ensure `NEXT_PUBLIC_APP_VERSION` accurately updates client bundles.

### Changed
- Refactored internal workspace packages to `@klyro/core`.

---

## [0.1.2] - 2026-11-06

### Added
- **Email Verification Callback**: Updated Supabase `/auth/callback` to redirect to `/auth/verify?type=signup-success` upon successful email confirmation instead of dumping users on `/` with raw access tokens.

---

## [0.1.1] - 2026-11-06

### Added
- **Dynamic Verification Route**: Added `/auth/verify` supporting email verification, magic links, email change confirmations, and password recovery states.
- **Form State Preservation**: Fixed `SignupForm` controlled state to retain entered field values during validation errors and added real-time pre-submit validation.

---

## [0.1.0] - 2026-11-05

The inaugural release of **Klyro** — an open-source, web-based digital logic lab bench and 7400-series circuit simulator.

### Added

#### Circuit Board (3-Zone Layout)
- **Output Section (Top)**:
  - 16 output pins (`0`–`15`) plus `VCC` reference.
  - Live red LED indicators per output pin (`HIGH` = ON, `LOW` = OFF).
  - 2-digit 7-segment hex display decoding output pins `0`–`7` (`00` to `FF`) in real time (turns dark when power is OFF).
  - Master simulation power toggle button.
- **Breadboard Workspace (Middle)**:
  - Realistic blue lab bench canvas with 5 standardized 20-pin DIP IC slots.
  - Clear pin numbering (`1`–`20`) per slot, part number labeling, and pin connection handles.
  - Slot selection with blue highlight border and empty-slot hint banner.
  - Direct IC assignment via sidebar click or drag-and-drop.
- **Input Section (Bottom)**:
  - 16 digital input pins (`0`–`15`) plus `GND`.
  - Individual toggle switches to flip between `HIGH` and `LOW` with amber LED indicators.
  - Clock section with selectable frequency markers (0.5 Hz, 1 Hz, 5 Hz, 10 Hz), `GENERATE PULSE` button, and manual HIGH/LOW controls.

#### IC Library & Navigation
- **31 7400-Series ICs** organized across 5 distinct categories:
  - Basic Gates (17 ICs)
  - Flip-Flops (2 ICs)
  - Counters (4 ICs)
  - Registers (2 ICs)
  - Combinational Logic (6 ICs)
- Instant search filtering by part number or name, collapsible categories, and star indicators for advanced MSI ICs.
- Responsive sidebar with smooth collapse to a compact icon rail.

#### Wire Routing & Real-Time Signal Colors
- Interactive click-and-drag wiring between pin handles.
- Orthogonal routing engine generating clean step-path schematics.
- Dynamic 4-value logic coloring in real time:
  - **GREEN**: `HIGH` (`1`)
  - **RED**: `LOW` (`0`)
  - **GRAY**: Unconnected / Not Simulated
  - **YELLOW**: Unknown / Contention (`X`)
- Connection validation rules preventing illegal wiring (e.g., output-to-output conflicts) with toast alerts.
- Wire selection and deletion via `Delete` / `Backspace`.

#### Signal Simulation — Basic Gates
- Event-driven discrete simulation engine evaluating circuit state on every input transition.
- Full gate evaluation for all 17 fundamental gate ICs:
  - **74LS00**: Quad 2-Input NAND
  - **74LS02**: Quad 2-Input NOR
  - **74LS03**: Quad 2-Input NAND (Open Collector)
  - **74LS04**: Hex Inverter (NOT)
  - **74LS05**: Hex Inverter (Open Collector)
  - **74LS08**: Quad 2-Input AND
  - **74LS10**: Triple 3-Input NAND
  - **74LS11**: Triple 3-Input AND
  - **74LS14**: Hex Schmitt-Trigger Inverter
  - **74LS20**: Dual 4-Input NAND
  - **74LS21**: Dual 4-Input AND
  - **74LS27**: Triple 3-Input NOR
  - **74LS30**: 8-Input NAND
  - **74LS32**: Quad 2-Input OR
  - **74LS38**: Quad 2-Input NAND Buffer (Open Collector)
  - **74LS86**: Quad 2-Input XOR
  - **74LS132**: Quad 2-Input NAND Schmitt-Trigger

#### Waveform Viewer & Diagnostics
- Multi-channel digital timing diagram recording signal history on every state change.
- Dedicated tracks for active inputs (`IN-x`), outputs (`OUT-x`), and clock signals.
- Color-coded waveforms (Green = `HIGH`, Red = `LOW`) with horizontal scroll support and history clearing.

#### Cloud Persistence & Project Isolation
- Full circuit state serialization to Supabase `circuits` table (`board_state`): IC slot placements, wire topology, input states, and power status.
- Strict project isolation ensuring IC assignments, wire connections, and inputs do not bleed between projects.
- Inline project title editing with automatic persistence and last-edited timestamp updates.
- Row-Level Security (RLS) policies protecting user circuits.

#### Properties Panel
- Collapsible right-hand inspector displaying part number, description, package type (DIP14/DIP16/DIP20), logic family (LSTTL/HCMOS), propagation delay, and live pin states table during simulation.
- Quick actions for viewing datasheets and component removal.
- Seamless Dark and Light theme integration.

