# Warehouse Logistics Agent

**Track 1 — Informed Search (Unit 2).** An autonomous forklift agent that picks up packages
and delivers them to loading bays in a grid warehouse with static shelf obstacles, planning
every move with **A\* search** and a **Manhattan distance** heuristic.

Runs **entirely in the browser** — no backend, no database, no API keys. Built with
**SvelteKit + TypeScript**.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

Other commands: `npm run build`, `npm run preview`, `npm run check`.

## The scenario

A 26×16 warehouse. Shelf racks are two cells deep, separated by single-cell picking aisles,
with clear cross-aisles at the top, middle and bottom. Three loading bays (**BAY-A**,
**BAY-B**, **BAY-C**) sit on the dock along the left wall, and the forklift parks at the
bottom of the dock aisle between shifts.

Each shift the agent is handed a manifest of packages, each addressed to a bay. It then:

1. **Selects a task** — the unclaimed package with the smallest Manhattan distance from
   where it currently stands.
2. **Drives to it** — one A\* search over the shelf layout (leg 1).
3. **Carries it to the bay** — a second, independent A\* search (leg 2).
4. Repeats until the manifest is empty.

A package that is walled in by racks is reported as unreachable and skipped; the rest of the
shift still completes.

## The algorithm

`src/lib/algorithms/astar.ts` is pure TypeScript with no UI dependencies, so it can be read
and explained on its own.

- `f(n) = g(n) + h(n)`
- `g(n)` — cost from the leg's start to the current node (1 per move)
- `h(n) = |x₁ - x₂| + |y₁ - y₂|` — Manhattan distance, admissible on a 4-connected grid, so
  each leg is an optimal route
- Actuators: drive up, down, left, right — each move costs 1
- Ties on `f` are broken by the lower `h`, which pushes the search towards the target

`src/lib/algorithms/mission.ts` layers the logistics on top: task selection, the two legs per
package, and the running totals across the shift.

Each search runs to completion synchronously and records every decision as a `SearchEvent`.
The UI then replays those traces frame by frame — **the animation is the real execution**,
not a scripted approximation.

## What's on screen

| Section           | What it shows                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warehouse Floor   | Shelf racks, loading bays, packages, the forklift (ringed amber while laden), the frontier, expanded cells and the optimal route for the current leg                                           |
| Live Decision Log | The manifest, each leg as it starts, every node expanded with `g(n)`/`h(n)`/`f(n)`, every node pushed to the open list, every rejected neighbour with its reason, and each pickup and delivery |
| Shift Performance | Total path cost, deliveries, nodes expanded, nodes visited, execution time, cells driven, A\* legs                                                                                             |
| PEAS Framework    | Performance measure, environment, actuators, sensors                                                                                                                                           |

Controls: **Start Shift**, **Reset** (new manifest, same racks), **New Warehouse**,
**Clear Racks**, plus a speed slider. Click or drag on the floor to add or remove shelf racks
between shifts.

## Structure

```text
src/
  lib/
    algorithms/
      astar.ts            # A* search, UI-free
      mission.ts          # task selection + multi-leg delivery planning
    warehouse.ts          # rack layout, bays, package generation
    types.ts              # shared domain and search types
    components/
      Warehouse.svelte    # floorplan rendering + rack painting
      Controls.svelte     # buttons and speed slider
      DecisionLog.svelte  # live reasoning feed
      Metrics.svelte      # shift performance tiles
      PeasPanel.svelte    # expandable PEAS section
      Legend.svelte       # colour key
  routes/+page.svelte     # orchestrates the shift and the animation
```

## PEAS

- **Performance measure** — all packages delivered to the correct bay, lowest total path
  cost, fewest nodes expanded per leg
- **Environment** — a fully observable, static, discrete grid warehouse: floor aisles, static
  shelf racks, packages and loading bays
- **Actuators** — drive up, down, left or right (each move costs 1), pick up a package, drop
  it at a bay
- **Sensors** — own position and load state, the four neighbouring cells, the shelf map,
  package positions and bay locations

## Deploy to Vercel

Import the repository on Vercel and press **Deploy** — every setting on the import screen can
stay at its default:

- **Application Preset:** SvelteKit
- **Root Directory:** `./`
- **Build / Output / Install Command:** leave the overrides off
- **Environment Variables:** none — the project needs no keys, backend or database

The project uses `@sveltejs/adapter-vercel`, and `src/routes/+layout.ts` sets
`prerender = true` / `ssr = false`, so the build emits a static `index.html` plus the client
bundle. Pushes to `main` redeploy automatically.
