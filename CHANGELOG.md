# Changelog

All notable changes to the **Klyro** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - v0.2.0 (In Progress)

The `v0.2.0` milestone focuses on advanced combinatorial/sequential tools, desktop distribution, and hardware description language (HDL) exports.

### In Progress & Planned
- **Desktop Application**:
  - Electron wrapper for native Windows packaging and offline simulation capabilities.
- **K-Map Solver & Minimizer**:
  - Interactive Karnaugh Map solver with automated Quine-McCluskey boolean expression minimization.
- **Sequential Building Blocks**:
  - Multiplexers (74LS151, 74LS157), Decoders (74LS138), Shift Registers (74LS164/194), and Adders (74LS83/283).
- **FSM / ASM Chart Builder**:
  - Visual Finite State Machine state transition diagrams with excitation table and logic synthesis generation.
- **HDL Export**:
  - One-click schematic-to-code export producing synthesizable Verilog and VHDL modules.
- **Multi-bit Bus & Subcircuit Packaging**:
  - Modular subcircuit packaging into reusable custom IC blocks and multi-wire bus routing.

---

## [0.1.0] - 2026-11-05

The inaugural release of **Klyro** — a full-featured, open-source web-based lab bench and digital logic simulator.

### Added

#### Virtual Breadboard & Schematic Canvas
- Interactive digital breadboard canvas built on React Flow with custom rendering nodes.
- Modular component placement: DIP-14 and DIP-16 IC sockets, VCC/GND power rails, digital input toggles (switches, buttons), variable clock generators, and output LED probes.
- Deterministic orthogonal channel router for clean wire runs and pin collision avoidance.
- Smart pin connection rules: prevents invalid topologies (e.g., output-to-output conflicts, unpowered IC pins) with contextual toast alerts.
- Canvas keyboard shortcuts: selection clearance on `Escape`, hotkey panning, and fast component placement.
- Side panel IC catalog with instant drag-and-drop / click-to-place assignment.
- Collapsible Properties Panel detailing IC pinouts, active pin voltages, and gate configurations.

#### Event-Driven Simulation Engine (`@klyro/core`)
- Discrete event simulation engine supporting 4-value logic states (`0`, `1`, `X` [undefined], `Z` [high-impedance]).
- Centralized `EventScheduler` and typed `EventBus` architecture for deterministic signal propagation.
- Real-time wire state visualization with instant color-coded feedback (High, Low, Floating).
- Bidirectional signal propagation across interconnected jumper wires and IC internal gates.
- Built-in `NetlistCompiler` to serialize and validate circuit connectivity.

#### 7400-Series TTL IC Library
- Standard combinatorial gates:
  - **74LS00**: Quad 2-Input NAND
  - **74LS02**: Quad 2-Input NOR
  - **74LS04**: Hex Inverter (NOT)
  - **74LS08**: Quad 2-Input AND
  - **74LS32**: Quad 2-Input OR
  - **74LS86**: Quad 2-Input XOR
- Sequential & arithmetic building blocks:
  - **74LS74**: Dual D-Type Positive-Edge-Triggered Flip-Flops with Preset & Clear
  - **74LS90**: 4-Bit Decade / BCD Counter with dual clock inputs
- Accurate physical pinouts, pin labeling, and internal gate mapping for all components.

#### Waveform Viewer & Diagnostics
- Multi-tab bottom panel containing:
  - **Waveform Viewer**: Oscilloscope-style timing diagrams with clock cycle markers, signal toggles, and pan/zoom.
  - **Console**: Real-time simulation event logging and error diagnostics.
  - **Netlist**: Raw netlist inspection of the active breadboard circuit.

#### Cloud Workspace & Supabase Backend
- Complete board state serialization: saves and restores IC positions, wire connections, inputs, clock states, and project metadata.
- Frictionless guest mode: instant anonymous circuit playground with single-project isolation and smooth login handoff.
- Supabase authentication: Email/Password, OAuth callbacks, SSR session handling, and activity timeout middleware.
- Account dashboard: circuit history grid, project renaming, last-edited sorting, and custom avatar upload modal.

#### Web Platform & SEO
- Full Next.js 15 App Router architecture with Turborepo monorepo management.
- Dynamic theme provider (Dark / Light mode) with flash-free local storage persistence.
- Comprehensive OpenGraph, Twitter Cards, robots indexing directives, and metadata configurations across `/`, `/account`, `/auth/login`, `/auth/signup`, and `/editor/[projectId]`.

