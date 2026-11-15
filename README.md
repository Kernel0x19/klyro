# Klyro

Klyro is an open-source digital logic simulator for the browser. Build and wire
circuits on a virtual breadboard, inspect signals as they change, and turn
simplified Boolean expressions into circuits.

[Open Klyro](https://klyro.live/) · [Changelog](CHANGELOG.md) ·
[Report an issue](https://github.com/Kernel0x19/klyro/issues) ·
[AGPL-3.0 license](LICENSE)

## What you can do

- **Build circuits** with 31 simulated 7400-series ICs, including logic gates,
  multiplexers, flip-flops, counters, and shift registers. The board has five
  IC sockets, 16 digital inputs, and 16 outputs.
- **Inspect signals** with live pin states, output LEDs, a two-digit hex display,
  and a waveform viewer. Run a continuous clock or step through one pulse at a
  time.
- **Simplify Boolean logic** using 2–5-variable Karnaugh maps, a synced truth
  table, and minimal sum-of-products (SOP) and product-of-sums (POS) expressions.
- **Build a circuit from a K-map** by converting the minimized SOP expression
  into wired ICs. The generated circuit must fit within the board’s five slots.
- **Keep and share your work** by signing in to save projects or exporting the
  board as a PNG.

## Try the editor

Open Klyro in a desktop or laptop browser and select **Open Board** or **Open K-Map**.

1. In **Board**, place a `74LS08` AND gate. Switch to **Wire** with `W`, connect
   inputs `0` and `1` to pins `1` and `2`, and connect pin `3` to output `0`.
2. Turn on board power and toggle the inputs. Output `0` lights up when both
   inputs are high.
3. To try synthesis, switch to **K-Map Visualiser**, choose three variables, and
   enter `A'B + BC'` in **Load SOP**. Submit the expression and select
   **Build Circuit** to place the generated circuit on the board.

## Run locally

You’ll need Node.js 20 or later, pnpm 9 (the workspace pins `9.0.0`), and a
Supabase project.

### Install dependencies

```sh
git clone https://github.com/Kernel0x19/klyro.git
cd klyro
pnpm install
```

### Configure Supabase

Create `packages/web/.env.local` with your project URL and anon key. The web
client and server read separate variable names for the same credentials.

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Sign-in uses Supabase Auth. Set the site URL to `http://localhost:3000` and allow
`http://localhost:3000/auth/callback` as a redirect URL for local development.
Enable the GitHub provider to test GitHub sign-in.

Saving projects requires a `circuits` table with row-level security policies that
allow users to manage their own rows. A complete SQL setup script with table definition,
indexes, and RLS policies is provided in the [Web App documentation](packages/web/README.md#database-schema-sql).

### Start the app

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). To build the workspace for
production, run `pnpm build` from the repository root.

## Repository layout

| Path | Contents |
| --- | --- |
| [`packages/web`](packages/web) | Next.js web app, circuit editor, board simulation, K-map tools, and Supabase integration |
| [`packages/core`](packages/core) | TypeScript simulation primitives, event scheduler, netlist compiler, and component registry |

## Contributing

Open a [GitHub issue](https://github.com/Kernel0x19/klyro/issues) to report a bug
or propose a change. For circuit bugs, include the IC part numbers, pin
connections, and expected and observed outputs. For K-map bugs, include the
expression or truth table. In a pull request, describe how you verified the
behavior you changed.

## License

Klyro is licensed under the
[GNU Affero General Public License v3.0](LICENSE) (`AGPL-3.0-only`).
