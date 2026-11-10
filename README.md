<div align="center">

# Klyro

**The open-source digital logic lab bench — right in your browser, no hardware required.**

An interactive Digital Logic & Computer Systems simulator designed for students, educators, and engineers to design, simulate, and understand digital electronics — from fundamental logic gates to complex sequential microarchitectures.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL_3.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-red?style=flat&logo=turborepo)](https://turbo.build/)
[![Status](https://img.shields.io/badge/Status-v0.3.0%20(Latest)-brightgreen)](#status)

</div>

---

## 🚀 Status

- ✅ **`v0.3.0` (Latest Stable)** — K-Map Visualiser module: 2/3/4-variable Karnaugh maps, Quine-McCluskey minimal SOP & POS solver, Petrick's method for multi-cover selection, prime implicant group overlays with color-coding, truth table ↔ K-Map cell sync, and expression output panel with copy buttons.
- ✅ **`v0.2.4`** — Undo/redo (Ctrl+Z/Y) via `zundo` temporal middleware, PNG export via `html-to-image`, 30s auto-save, keyboard shortcuts modal (12 shortcuts), show-grid toggle, power button in topbar, and dirty state indicator.
- ✅ **`v0.2.3`** — Account security & settings overhaul (current password verification, PostgreSQL RPC account deletion, session revocation), 60-second anti-spam cooldown rate limiting, passwordless OTP/magic-link sign-in, inline 6-to-8 digit OTP verification, and cross-browser password reset support.

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and patch histories.

---

## ✨ Features Delivered in v0.1.0

### 🧪 3-Zone Virtual Breadboard & Canvas
- **Output Section (Top)**:
  - 16 output pins (`0`–`15`) plus `VCC` voltage reference.
  - Real-time LED indicators per pin (Red = `HIGH`, Off = `LOW`).
  - 2-digit 7-segment hex display reading output pins `0`–`7` (`00` to `FF`) with realistic dark state when power is switched off.
  - Master simulation power toggle switch.
- **Breadboard Workspace (Middle)**:
  - Blue digital lab bench canvas featuring 5 standardized 20-pin DIP IC sockets.
  - Pin numbering (`1`–`20`) per slot, part number labeling, and pin connection handles.
  - Empty-slot hint banners and blue selection borders.
  - Component placement via sidebar click or direct drag-and-drop.
- **Input Section (Bottom)**:
  - 16 digital input pins (`0`–`15`) plus `GND`.
  - Individual toggle switches to flip between `HIGH` and `LOW` with amber LED indicators.
  - Clock section with selectable frequency markers (0.5 Hz, 1 Hz, 5 Hz, 10 Hz), `GENERATE PULSE` button, and manual HIGH/LOW momentary triggers.

### 🧰 IC Library & Editor Tool System
- **31 7400-Series ICs** organized into 5 categories: Basic Gates (17), Flip-Flops (2), Counters (4), Registers (2), and Combinational Logic (6).
- Real-time search filter by part number or name, collapsible category groups, and star badges for advanced ICs.
- Sidebar collapses into a sleek icon rail.
- **Dedicated Editor Tools**:
  - **Select (`V`)**: Fixed canvas (`panOnDrag` disabled) for selecting ICs and dragging & dropping chips from the library.
  - **Wire (`W`)**: Fixed canvas with active pin handles and crosshair cursor for drawing connections.
  - **Pan (`H`)**: Smooth canvas dragging (`panOnDrag`) with grab cursor.
  - **Delete (`D`)**: Click any wire or IC slot to delete it immediately (with automatic cascade deletion of connected wires).
  - Hover highlights: 16px wide interaction hitboxes, red dashed outlines with glow for wires, and remove badges for ICs.

### ⚡ Signal Simulation — Basic Gates (17 ICs)
- Event-driven simulation engine evaluating logic propagation across inputs, ICs, and outputs on every state change.
- 4-value logic model: `HIGH` (`1`), `LOW` (`0`), `X` (Unknown/Contention), and `Unconnected`.
- Full gate evaluation implemented for all 17 fundamental gate ICs:
  - **NAND**: 74LS00, 74LS03 (Open Collector), 74LS10 (3-Input), 74LS20 (4-Input), 74LS30 (8-Input), 74LS38 (Buffer OC), 74LS132 (Schmitt-Trigger)
  - **AND**: 74LS08, 74LS11 (3-Input), 74LS21 (4-Input)
  - **NOR**: 74LS02, 74LS27 (3-Input)
  - **OR**: 74LS32
  - **XOR**: 74LS86
  - **NOT**: 74LS04, 74LS05 (Open Collector), 74LS14 (Schmitt-Trigger)

### 📈 Waveform Viewer & Diagnostics
- Oscilloscope-style timing diagrams tracking signal histories for active inputs (`IN-x`), outputs (`OUT-x`), and clock signals.
- Color-coded waveforms (Green = `HIGH`, Red = `LOW`) with horizontal scroll support and history clearing.

### ☁️ Cloud Persistence & Project Isolation
- Full circuit state serialization to Supabase `circuits` table (`board_state`): IC slots, wire network, input states, and power status.
- Strict project isolation ensuring IC assignments, wire connections, and inputs do not bleed between projects.
- Inline project title editing with automatic persistence and last-edited timestamp updates.

### 📋 Properties Inspector
- Collapsible right drawer showing part number, full IC name, package type (DIP14/DIP16/DIP20), logic family (LSTTL/HCMOS), propagation delay in ns, live pin states table, and datasheet link.

---

## ⚡ Simulation Engine & IC Coverage (v0.2.0)

**Full Coverage**: All 31 ICs simulate with complete combinational, sequential, and clocking behavior.

### 🧩 Custom Evaluators for Combinational ICs
- [x] **74LS83**: 4-bit binary adder with fast internal lookahead carry
- [x] **74LS85**: 4-bit magnitude comparator ($A > B$, $A < B$, $A = B$) with cascading inputs
- [x] **74LS138**: 3-to-8 decoder with enable pins ($G_1$, $\overline{G}_{2A}$, $\overline{G}_{2B}$)
- [x] **74LS139**: Dual 2-to-4 demultiplexer with individual active-low enables
- [x] **74LS151**: 8-to-1 MUX with select logic, strobe, and complementary outputs
- [x] **74LS153**: Dual 4-to-1 MUX with independent enable inputs

### ⏱️ Sequential IC Engine
- [x] Dynamic clock edge detection (rising $\uparrow$ and falling $\downarrow$ transitions)
- [x] **74LS74**: Dual D flip-flop with preset ($\overline{PRE}$) and clear ($\overline{CLR}$)
- [x] **74LS76**: Dual JK flip-flop master-slave architecture with preset and clear

### 🔢 Counter State Machines
- [x] **74LS90**: BCD decade counter (mod-2 and mod-5 sections)
- [x] **74LS93**: 4-bit binary counter (mod-2 and mod-8 sections)
- [x] **74HC191 / 74LS191**: Synchronous up/down counter with mode and enable controls

### 🔄 Shift Register Modes
- [x] **74HC194 / 74LS194**: 4-bit bidirectional universal shift register supporting all operational modes:
  - SISO (Serial-In, Serial-Out)
  - SIPO (Serial-In, Parallel-Out)
  - PISO (Parallel-In, Serial-Out)
  - PIPO (Parallel-In, Parallel-Out)
  - Parallel load and asynchronous master reset

### ⚡ Active Clock Driving Sequential ICs
- [x] Interactive frequency selector (0.5 Hz, 1 Hz, 5 Hz, 10 Hz) pulsing the clock periodically
- [x] `GENERATE PULSE` button delivering a single rising edge for step-by-step debugging

---

## 🏗️ Architecture & Monorepo Structure

Klyro is organized as a Turborepo monorepo powered by `pnpm`:

```text
klyro/
├── packages/
│   ├── core/              # @klyro/core — Discrete-event simulation engine & IC registry
│   │   ├── src/
│   │   │   ├── bus/       # EventBus & EventTypes
│   │   │   ├── components/# BasicGates & ComponentRegistry
│   │   │   ├── contracts/ # Circuit, Component, Signal interfaces
│   │   │   └── engine/    # EventScheduler & NetlistCompiler
│   │   └── package.json
│   ├── web/               # @klyro/web — Next.js 15 Web Application
│   │   ├── app/           # App Router (/, /account, /auth, /editor)
│   │   ├── components/    # React Flow canvas, waveform viewer, UI widgets
│   │   ├── lib/           # Supabase client, IC library definitions, routers
│   │   └── package.json
│   └── desktop/           # @klyro/desktop — Electron native app (v0.2.0)
├── turbo.json             # Turborepo task pipeline configuration
├── CHANGELOG.md           # Semantic versioning release history
└── package.json
```

---

## 💻 Tech Stack

- **Core Engine**: TypeScript, Vitest, Tsup
- **Web App**: Next.js 15, React 19, Tailwind CSS, Framer Motion
- **Canvas & Graph**: React Flow (`@xyflow/react`), Konva, ELKjs
- **Persistence & Backend**: Supabase (Auth, Postgres, Storage)
- **Monorepo Tools**: Turborepo, pnpm workspaces

---

## 🏁 Getting Started

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0` (`npm install -g pnpm`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pratham-78/klyro.git
   cd klyro
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables in `packages/web/.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building

To build all packages in the workspace:
```bash
pnpm build
```

---

## 📄 License

This project is open-source and licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE).
