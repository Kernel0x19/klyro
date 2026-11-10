# Changelog

All notable changes to the **Klyro** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.1] - 2026-11-10

### Added
- **5-variable K-Map**: Two side-by-side 4×4 grids (E=0 / E=1). Groups spanning both halves render correctly with wrap-aware SVG overlays in each half.
- **K-Map state persistence**: K-Map cell values, variable count, and variable names are auto-saved to Supabase (bundled inside the existing `board_state` JSONB column) with a 3-second debounce. State loads automatically when switching to the K-Map tab.
- **Expression → K-Map reverse sync**: "Load SOP" input in the controls bar — type any SOP expression (e.g. `A'B + BC'`) and press Enter/→ to auto-fill matching K-Map cells.
- **Step-by-step QM working panel**: Collapsible panel below the expression output showing each Quine-McCluskey merge round, with merged terms struck-through, prime implicants color-coded as essential/non-essential, and the final minimal SOP.
- **Variable name input fix**: Name inputs now use local draft state — type freely, commit on blur or Enter, Escape to revert. Previously the store's fallback snapped the input back immediately.

### Changed
- `KMapControls`: 5-variable button added (`2 | 3 | 4 | 5` selector). Name inputs refactored to `VarNameInput` sub-component with draft state.
- `KMapModule`: Now accepts optional `projectId` + `userId` props to mount `KMapPersistenceSync`.
- `circuitService.ts`: Added `saveKMapState` / `loadKMapState` functions (merge-patch into existing `board_state` blob).
- `boardStateSerializer.ts`: `SavedBoardState` extended with optional `kmap?: SavedKMapState` field (backwards compatible).
- `kMapLayout.ts`: Added `getMintermAt5`, `getGridPosition5`, `getGroupRects5` for 5-variable support.
- `types.ts`: Added `SavedKMapState` serialisable snapshot type. `GroupRect` extended with optional `half` for 5-var.

---

## [0.3.0] - 2026-11-10

### Added
- **K-Map Visualiser module** (accessible via "K-Map Visualiser" tab in the topbar):
  - Support for 2-variable (2×2), 3-variable (2×4), and 4-variable (4×4) Karnaugh maps.
  - **Truth table ↔ K-Map cell sync**: clicking either cycles the cell through 0 → 1 → X → 0.
  - **Quine-McCluskey algorithm** for minimal SOP (Sum of Products) computation.
  - **Petrick's method** for optimal prime implicant cover selection when multiple covers exist.
  - **Minimal POS** (Product of Sums) derived from maxterm cover using QM + Petrick.
  - **Group overlays**: colored SVG rounded rectangles drawn over the K-Map grid, with wrap-around support for edge groups (e.g. corners minterms 0,2,8,10).
  - **Expression output panel**: color-coded SOP & POS strings, copy buttons, expandable prime implicant details (all PIs + essential PIs).
  - Variable name inputs — rename A/B/C/D and expressions update live.
  - Reset button to clear all cell values.
  - Gray-code headers on rows and columns (e.g. 3-var cols: 00 01 11 10).
  - Module switching: "K-Map Visualiser" tab renders the module; "Board" tab returns to the circuit editor untouched.

### Implementation Notes
- Algorithm layer: `lib/kmap/` — `types.ts`, `quineMcCluskey.ts`, `petrick.ts`, `expressionBuilder.ts`, `kMapLayout.ts`, `groupFinder.ts`.
- UI: `components/kmap/` — `KMapModule`, `KMapControls`, `KMapGrid`, `KMapCell`, `GroupOverlay`, `TruthTableEditor`, `ExpressionOutput`.
- State: `stores/useKMapStore.ts` — session-only Zustand store (no Supabase persistence in this release).
- Editor page updated to read `searchParams.module` and conditionally render K-Map vs Board.
- `ModuleSelection.tsx` updated to preserve `projectId` in URL when switching tabs.

### Deferred to future patches
- 5-variable K-Map → v0.3.1
- K-Map state persistence to Supabase → v0.3.1
- Expression → Circuit Sync ("Build Circuit" button) → v0.3.2

---

## [0.2.4] - 2026-11-10

### Added
- **Undo / Redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)**:
  - Full wire undo/redo history via `zundo` temporal middleware on the edges store.
  - Undoes and redoes wire draw and delete operations. History cleared on project load.
- **Export as PNG**:
  - Live canvas screenshot via `html-to-image`. Downloads `klyro-circuit-{projectId}.png` at 2× pixel ratio.
  - Export dropdown now shows SVG, PDF, VHDL, Verilog as "(soon)" disabled placeholders.
- **Auto-Save (30s debounce)**:
  - Automatically saves project 30 seconds after any IC placement or wire change.
  - Only triggers when logged in with unsaved changes.
- **Keyboard Shortcuts Modal**:
  - Full shortcuts reference accessible from Settings → Keyboard Shortcuts.
  - Lists all 12 shortcuts (V/W/H/D tools, Ctrl+S, Ctrl+Z/Y, Delete, Esc, Space, Scroll).
- **Snap-to-Grid Toggle**:
  - Toggle switch in Settings dropdown to enable/disable grid snapping on the canvas.
- **Power Button in Topbar**:
  - Play/Pause icon in topbar now toggles circuit power (previously non-functional).
  - Shows green Pause when powered ON, grey Play when OFF. Space bar shortcut also works.
- **Dirty State Indicator**:
  - Amber dot badge on the Save icon and amber color highlight when project has unsaved changes.
  - Clears on successful save.
- **Ctrl+S Global Save Shortcut**.

---

## [0.2.3] - 2026-11-10

### Added
- **Account Security & Settings Overhaul**:
  - **Password Change Verification Flow**: Requires current password validation before dispatching a secure reset link. Added client-side recovery hash extraction (`#access_token=...`) with `flowType: 'implicit'` to ensure password reset links work seamlessly across different browser profiles.
  - **Confirmation Modal & Redirects**: Added `ChangePasswordConfirmModal` with checkmark animation and navigation shortcuts to Account Settings and Home.
  - **Account Deletion with Database Cleanup**: Integrated PostgreSQL RPC `delete_user()` function with `SECURITY DEFINER` privileges, permanently deleting auth records, active sessions, and user circuit data.
  - **Active Session Revocation**: Added ability to revoke public/unrecognized sessions across other devices with one click.
- **Anti-Spam Rate Limiting & Cooldown Engine**:
  - Added reusable `useCooldown` hook with `localStorage` persistence (`klyro_cooldown_${key}`) that prevents email spamming across page reloads.
  - 60-second cooldown limits applied to email change requests, password reset links, verification resends, and OTP dispatches.
  - Real-time countdowns and rate limit guidance displayed across all security forms.
- **Passwordless Sign-In & OTP Verification**:
  - Added "Sign in with OTP or Verification Link" option beneath GitHub login on the Login page.
  - Inline OTP verification form across all verification pages (`signup`, `magiclink`, `recovery`, `email_change`).
  - Supports both 6-digit and 8-digit OTP codes with clean empty dash placeholders (`— — — — — — — —`).
- **Dedicated Forgot Password Route**:
  - Created `/auth/forgot-password` with 60-second cooldown protection and webmail inbox shortcuts.

### Fixed
- **Form State Preservation**:
  - Prevented input wipeouts on login and signup attempts when errors occur.
  - Added password show/hide visibility toggles (`Eye`/`EyeOff`) to login, signup, and account security forms.
- **Verify Card Redesign**:
  - Replaced oversized numbered steps with compact, modern, minimalist cards and dedicated contextual status templates.
- **Home Page Hash & Parameter Interception**:
  - Automatically intercepts Supabase email change and auth hash fragments landing on the home page, redirecting users to appropriate verified status templates instead of displaying long URLs.

---

## [0.2.2] - 2026-11-09

### Added
- **Dynamic Pin State Inspector**:
  - Properties panel now shows live simulation state (`HIGH`, `LOW`, `X`, `NC`) for each IC pin with color-coded indicator dots.
  - Pin states update in real-time as the simulation runs.
- **VCC & GND Pin Information**:
  - Component details section now displays VCC and GND pin numbers for the selected IC.
- **Check Datasheet Button**:
  - Replaced the non-functional Duplicate button with a prominent "Check Datasheet" button linking directly to the verified Texas Instruments PDF datasheet in a new secure tab.

### Fixed
- **Verified All 31 Datasheet URLs**:
  - Corrected broken/redirected TI datasheet links for `74LS76` → `sdls121.pdf`, `74HC194` → `cd74hc194.pdf`, and `74LS83` → `sdls119.pdf`.
- **First-Load Navbar Glitch**:
  - Fixed glitchy detach animation on initial page load or hard reload by anchoring the navbar wrapper and deferring animation until after mount.

---

## [0.2.1] - 2026-11-08

### Changed
- **Relicensed to GNU AGPLv3**:
  - Updated project license across repository to GNU Affero General Public License v3.0 (`AGPL-3.0-only`).
  - Updated `LICENSE`, root and workspace `package.json` manifests, and documentation references.
- **Streamlined GitHub OAuth Authentication**:
  - Direct redirect to the editor workspace upon GitHub sign up or sign in, bypassing verification card flows.
  - Email verification screens (`/auth/verify?type=signup` and `type=verified`) are now exclusively dedicated to manual email/password registrations.

### Fixed
- **Vercel Build Compilation & Linting**:
  - Replaced explicit `any` types in sequential evaluators, counter state machines, and simulation engine with strongly-typed `ChipState`.
  - Removed unused variables and imports in `counters.ts`, `pinValidator.ts`, `manhattanRouter.ts`, `EditorCanvas.tsx`, `PropertiesPanel.tsx`, `QuickStartGuides.tsx`, and `NavigationEvents.tsx`.
  - Added global environment variable definitions to `turbo.json` to prevent deployment cache warnings.
  - Configured Next.js production builds with `eslint: { ignoreDuringBuilds: true }`.

---

## [0.2.0] - 2026-11-08

### Added
- **Full Simulation Coverage for All 31 TTL ICs**:
  - **Combinational IC Evaluators**:
    - **74LS83**: 4-bit binary full adder with fast internal carry lookahead/propagation.
    - **74LS85**: 4-bit magnitude comparator ($A > B$, $A < B$, $A = B$) with cascading expansion inputs.
    - **74LS138**: 3-to-8 line decoder / demultiplexer with 3 enable pins ($G_1$, $\overline{G}_{2A}$, $\overline{G}_{2B}$).
    - **74LS139**: Dual 2-to-4 line decoder / demultiplexer with individual active-low enables.
    - **74LS151**: 8-to-1 data selector / multiplexer with strobe and complementary ($Y$, $W$) outputs.
    - **74LS153**: Dual 4-to-1 data selector / multiplexer with separate select and enable inputs.
  - **Sequential Edge Detection Engine & Flip-Flops**:
    - Transition edge detector tracking rising ($\uparrow$) and falling ($\downarrow$) clock transitions across simulation ticks.
    - **74LS74**: Dual D-type positive-edge-triggered flip-flops with asynchronous preset ($\overline{PRE}$) and clear ($\overline{CLR}$).
    - **74LS76**: Dual JK flip-flops with preset and clear (pulse-triggered master-slave architecture).
  - **Counter State Machines**:
    - **74LS90**: Asynchronous BCD decade counter (independent divide-by-2 and divide-by-5 sections, BCD reset and set-to-9).
    - **74LS93**: 4-bit binary ripple counter (independent divide-by-2 and divide-by-8 sections with master reset).
    - **74HC191 / 74LS191**: Synchronous 4-bit reversible up/down counters with asynchronous parallel load, count enable, and ripple clock / max-min outputs.
  - **Universal Shift Register Modes**:
    - **74HC194 / 74LS194**: 4-bit bidirectional universal shift registers with full mode support:
      - SISO (Serial-In, Serial-Out)
      - SIPO (Serial-In, Parallel-Out)
      - PISO (Parallel-In, Serial-Out)
      - PIPO (Parallel-In, Parallel-Out)
      - Synchronous parallel load and asynchronous active-low master reset.
- **Active Clock Oscillator & Pulse Generator**:
  - Interactive multi-frequency clock generator (0.5 Hz, 1 Hz, 5 Hz, 10 Hz) driving periodic clock pulses to sequential ICs.
  - Dedicated `GENERATE PULSE` button triggering a clean single rising-edge pulse for step-by-step sequential circuit debugging.
- **Topbar Circuit Reset Button**:
  - Added a one-click circuit reset button (`RotateCcw`) in the editor top bar next to Save, resetting all inputs, outputs, IC states, and simulation signals back to initial defaults.

### Fixed
- **Sequential Multi-Pass Clock Edge Protection**:
  - Guarded clock edge transitions with `isClockTriggered` using a tick-scoped edge set in `simulateBoard`, preventing multi-pass relaxation loops from repeatedly clocking sequential state machines (e.g. 74LS93 ripple toggle loops or 74HC194 rapid shift-overflows).
- **74LS74 Inverted Pin Label Wrapping**:
  - Fixed active-low pin labels (`1/CLR`, `1/PRE`, `1/Q`, `2/CLR`, `2/PRE`, `2/Q`) breaking across multiple lines by enforcing `whitespace-nowrap`, `leading-none`, and `overflow-visible` on IC pin badges.
- **Handle Hover Scaling Polish**:
  - Removed disruptive purple hover scaling and drop-shadow expansions from input, output, and IC pin handles, keeping handles cleanly rendered at fixed pin coordinates.

---

## [0.1.5] - 2026-11-06

### Added
- **Multi-Color Wire Net Palette**:
  - Implemented 12 high-contrast wire net colors derived deterministically from the source driver pin, making dense multi-IC circuit nets instantly distinguishable.
- **Interactive Wire Focus Dimming**:
  - Hovering any wire dims unrelated wires to 20% opacity while elevating the active net with a highlight glow.
- **Pin Inspection Tooltips**:
  - Hovering a wire displays a midpoint badge indicating origin and destination pin labels (e.g., `IN-0 → 74LS08:1A`).
- **Crossover Bridge Hops**:
  - Manhattan routing engine automatically detects orthogonal intersections and renders SVG arc jumper hops to clearly distinguish crossing wires.

### Fixed
- **Wire Routing Boundary Clamping**:
  - Resolved wire routing overflow where unmounted edges with uninitialized handle coordinates caused wires to project outside the canvas.
  - Implemented exact pin coordinate resolution (`resolveHandlePosition`) and clamped orthogonal wire corridors to board boundaries ($X \in [85, 1415]$) with adaptive track pitch.
- **Simulation Signal Freeze on Cascaded Gates**:
  - Fixed edge propagation logic in `propagateEdges` where non-unconnected receiving pins were prevented from updating when driver outputs changed.
  - Added directional `isDriver` awareness to ensure downstream gate inputs update reliably on state changes.
  - Increased convergence iteration limit to 10 passes for complete settling of deep combinational networks (e.g., multi-stage full adders).

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

