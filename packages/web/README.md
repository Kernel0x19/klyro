# @klyro/web

The frontend web application for Klyro — an interactive digital logic lab bench, circuit simulator, and Karnaugh map visualizer.

Built with **Next.js 15 (Turbopack, App Router)**, **React 19**, **Tailwind CSS v4**, and **@xyflow/react**.

---

## Architecture Overview

```
packages/web/
├── app/                      # Next.js App Router (pages, layouts, auth routes)
│   ├── (auth)/               # Login, Signup, Reset Password, Verification
│   ├── board/                # Board editor route
│   ├── kmap/                 # K-Map Visualiser route
│   ├── editor/[id]/          # Unified project editor route with query switcher
│   └── dashboard/            # User saved projects list
├── components/               # React components
│   ├── board/                # Lab bench, DIP IC sockets, power switch, pin handles
│   ├── canvas/               # React Flow canvas, Manhattan wires, custom nodes
│   ├── kmap/                 # 2-5 variable K-map grids, truth table, expression output
│   ├── sidebar/              # IC library browser, search filter, categories
│   └── ui/                   # Modals, tooltips, dialogs, buttons
├── lib/
│   ├── kmap/                 # Quine-McCluskey, Petrick's method, circuit synthesizer
│   ├── supabase/             # Supabase client, server actions, and auth helpers
│   ├── boardStateSerializer  # Board state serialization for Supabase persistence
│   ├── circuitService.ts     # Save/load board & K-map state
│   ├── icLibrary.ts          # 31 7400-series IC definitions with pinouts & logic
│   └── manhattanRouter.ts    # Orthogonal wire routing between pins
└── stores/                   # Zustand stores
    ├── useBoardStore.ts      # Canvas state, IC placements, wires, undo/redo (zundo)
    └── useKMapStore.ts       # K-map cells, variable count, truth table, minimized terms
```

---

## Key Systems

### 1. Virtual Breadboard & Canvas (`@xyflow/react`)
- **3-Zone Layout**:
  - **Outputs (Top)**: 16 output pins with real-time LEDs, master power toggle, and a 2-digit 7-segment hex display (`00`–`FF`).
  - **Breadboard Workspace (Middle)**: 5 standardized 20-pin DIP IC sockets labeled with part numbers and connection handles.
  - **Inputs (Bottom)**: 16 digital input switches (`HIGH`/`LOW`), `GND`/`VCC` rails, and an adjustable clock generator (0.5 Hz–10 Hz, single-pulse step).
- **Wiring & Routing**:
  - Manhattan orthogonal wire routing (`lib/manhattanRouter.ts`) with obstacle avoidance.
  - Pin connection validation (`lib/pinValidator.ts`) preventing short circuits.
- **Editor Tool Modes**:
  - Select (`V`), Wire (`W`), Delete (`D`), Pan (`H`).

### 2. K-Map Visualizer & Circuit Synthesizer
- **2 to 5-Variable Karnaugh Maps**:
  - Supports 2, 3, 4, and 5-variable (dual 4×4 half-maps) K-Maps with Gray-code coordinate mapping.
  - Two-way sync: Clicking K-Map cells updates the truth table; editing the truth table updates the K-Map.
  - Interactive two-way hover highlighting: Hovering on a truth table row highlights the corresponding K-Map cell, and hovering on a cell highlights the truth table row.
  - Quick-Fill toolbar actions: 1-click "All 0", "All 1", and "Invert" buttons to rapidly populate or invert cell values.
- **Minimization Algorithms & Output (`lib/kmap/`)**:
  - Quine-McCluskey solver (`quineMcCluskey.ts`) computes prime implicants.
  - Petrick's method (`petrick.ts`) finds the exact minimal Sum of Products (SOP) and Product of Sums (POS).
  - Displays canonical minterm ($\Sigma m$) and maxterm ($\Pi M$) notation with 1-click copy buttons.
  - Export K-Map workspace as high-resolution PNG (`klyro-kmap-<projectId>.png`).
  - Reverse sync: `loadFromSOP` parses user-entered Boolean equations and populates the K-Map.
- **Boolean Expression → Circuit Synthesis (`circuitSynthesizer.ts`)**:
  - Translates minimal SOP equations directly into physical TTL ICs (`74LS04` NOT, `74LS08`/`74LS11`/`74LS21` AND, `74LS32` OR).
  - Automatically places ICs into breadboard sockets and wires inputs and outputs.
  - Offers a confirmation dialog (`BuildCircuitModal.tsx`) to create a new project or overwrite the current board.

### 3. State Management (`stores/`)
- **`useBoardStore`**: Manages placed ICs, pin connections, wire paths, simulation power, and tool modes. Wrapped with `zundo` temporal middleware for full Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) history.
- **`useKMapStore`**: Manages variable count (2–5), custom variable names, cell values (`0`, `1`, `X`), prime implicant groups, and active highlight states.

---

## Supabase Database Setup

Klyro uses Supabase for authentication, user profiles, and persistent circuit storage.

### Environment Variables

Create `packages/web/.env.local`:

```dotenv
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Client-side Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side Supabase credentials (can match anon key or service role)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Database Schema (SQL)

Run the following SQL in your Supabase SQL Editor to set up the `circuits` table and Row Level Security (RLS) policies:

```sql
-- 1. Create the circuits table
create table if not exists public.circuits (
  id uuid default gen_random_uuid() primary key,
  project_id text not null unique,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Untitled Project',
  module text not null default 'board',
  board_state jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_edited timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.circuits enable row level security;

-- 3. RLS Policies (Users can only access and modify their own circuits)
create policy "Users can view their own circuits"
  on public.circuits for select
  using (auth.uid() = user_id);

create policy "Users can create their own circuits"
  on public.circuits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own circuits"
  on public.circuits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own circuits"
  on public.circuits for delete
  using (auth.uid() = user_id);

-- 4. Create index for fast project lookup
create index if not exists idx_circuits_user_id on public.circuits(user_id);
create index if not exists idx_circuits_project_id on public.circuits(project_id);
```

### Auth Configuration
1. In the Supabase Dashboard, go to **Authentication -> URL Configuration**.
2. Set **Site URL** to `http://localhost:3000`.
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**.
4. (Optional) Under **Authentication -> Providers**, enable GitHub or Google OAuth if desired.

---

## Development Scripts

Run from the repository root:

```bash
# Start Next.js development server with Turbopack (http://localhost:3000)
pnpm dev

# Build the web application for production
pnpm build

# Start production server
pnpm --filter @klyro/web start

# Run ESLint
pnpm --filter @klyro/web lint
```
