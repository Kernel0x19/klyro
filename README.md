<div align="center">

# Klyro

**The open-source digital logic lab bench — right in your browser, no hardware required.**

An interactive Digital Logic & Computer Systems simulator designed for students, educators, and engineers to design, simulate, and understand digital electronics — from fundamental logic gates to complex sequential microarchitectures.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-red?style=flat&logo=turborepo)](https://turbo.build/)
[![Status](https://img.shields.io/badge/Status-v0.1.0%20(Complete)%20%7C%20v0.2.0%20(In%20Progress)-brightgreen)](#status)

</div>

---

## 🚀 Status

- ✅ **`v0.1.0` (Complete)** — Foundational web release featuring the interactive breadboard canvas, discrete event simulation engine (`@klyro/core`), 7400-series TTL IC library, live waveform viewer, Supabase cloud sync, and user project management.
- 🚧 **`v0.2.0` (In Progress)** — Active development focusing on native desktop distribution (Electron), Karnaugh Map solver with Quine-McCluskey minimization, visual FSM/ASM chart builder, and HDL code generation (Verilog / VHDL).

See [CHANGELOG.md](CHANGELOG.md) for full release notes and milestone breakdown.

---

## ✨ Features Delivered in v0.1.0

### 🧪 Interactive Virtual Breadboard & Schematic Canvas
- **DIP-14 & DIP-16 IC Mounting**: Place and arrange standard dual-inline package ICs with realistic pin spacing.
- **Power & Signal Rails**: Integrated VCC and GND power buses, interactive digital input toggles (switches and momentary pushbuttons), pulse generators, and output LED probes.
- **Deterministic Channel Routing**: Smart orthogonal wire routing engine that prevents overlapping traces and maintains clean schematics.
- **Pin Constraint & Collision Enforcement**: Real-time validation preventing illegal topologies (output-to-output conflicts, invalid shorts) with contextual error toasts.
- **Keyboard Shortcuts**: Quick selection clearing with `Escape`, component navigation, and hotkey controls.

### ⚡ Event-Driven Simulation Engine (`@klyro/core`)
- **4-Value Logic**: Accurate digital logic simulation supporting `0` (LOW), `1` (HIGH), `X` (Undefined/Contention), and `Z` (High Impedance).
- **Event-Driven Signal Propagation**: Centralized `EventScheduler` and event bus architecture ensure zero-delay or realistic propagation delay modeling.
- **Live Wire Recoloring**: Wires update color dynamically reflecting voltage state in real time.
- **Bidirectional Signal Paths**: True multi-point junction support across jumper wires and IC pin networks.
- **Netlist Compiler**: Validates and serializes circuit graphs into standardized netlists.

### 📦 7400-Series TTL IC Library
Modeled with physical pinouts, logic gate mappings, and functional truth tables:
- **74LS00**: Quad 2-Input NAND Gate
- **74LS02**: Quad 2-Input NOR Gate
- **74LS04**: Hex Inverter (NOT Gate)
- **74LS08**: Quad 2-Input AND Gate
- **74LS32**: Quad 2-Input OR Gate
- **74LS86**: Quad 2-Input XOR Gate
- **74LS74**: Dual D-Type Positive-Edge-Triggered Flip-Flop with Preset & Clear
- **74LS90**: 4-Bit Decade / BCD Counter

### 📊 Waveform Viewer & Diagnostics
- **Oscilloscope-Style Timing Diagrams**: Multi-channel waveform viewer synchronized with clock ticks, supporting zoom, pan, and transition inspection.
- **Simulation Console**: Live event stream logging pin state changes and debug diagnostics.
- **Netlist Inspector**: Inspect generated circuit connections on the fly.
- **Properties Inspector**: Detailed side drawer showcasing active IC pin voltages, gate assignments, and logic states.

### ☁️ Cloud Persistence & User Accounts
- **Supabase Cloud Sync**: Complete circuit state serialization (components, wire graphs, inputs, project details) synced seamlessly.
- **Guest Playground**: Immediate anonymous circuit sandbox with automatic project handoff upon sign-up.
- **Secure Authentication**: Email/Password and OAuth authentication, SSR session handling, and activity timeout middleware.
- **Account Dashboard**: Manage circuit projects, review edit histories, rename projects, and customize user avatars.

---

## 🛠️ v0.2.0 Roadmap (In Active Development)

- [ ] **Electron Desktop App**: Cross-platform native Windows desktop installer and offline lab bench.
- [ ] **K-Map Solver**: Interactive Karnaugh maps with Quine-McCluskey boolean algebraic simplification.
- [ ] **Sequential MSI ICs**: 74LS138 (3-to-8 Decoder), 74LS151/157 (Multiplexers), and 74LS164/194 (Shift Registers).
- [ ] **FSM / ASM Chart Builder**: State transition diagram editor with excitation table auto-generation.
- [ ] **HDL Code Generation**: Export completed breadboard schematics to synthesizable Verilog and VHDL.
- [ ] **Subcircuits & Bus Routing**: Package circuits into custom multi-pin IC modules and multi-bit signal buses.

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

This project is open-source and licensed under the [MIT License](LICENSE).
