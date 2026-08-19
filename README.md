# A* Grid Navigation Agent

An autonomous pathfinding agent that runs **entirely in the browser** — no backend, no
database, no API keys. Built with **SvelteKit + TypeScript**.

The agent searches a 25×16 grid for the shortest obstacle-free path from a start cell to a
goal cell using **A\*** search, while streaming its reasoning to a live decision log.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

Other commands: `npm run build`, `npm run preview`, `npm run check`.

## Deploy to Vercel

Import `voltcrash/automaze` on Vercel and press **Deploy** — every setting on the import
screen can stay at its default:

- **Application Preset:** SvelteKit
- **Root Directory:** `./`
- **Build / Output / Install Command:** leave the overrides off
- **Environment Variables:** none — the project needs no keys, backend or database

The project uses `@sveltejs/adapter-vercel`, and `src/routes/+layout.ts` sets
`prerender = true` / `ssr = false`, so the build emits a static `index.html` plus the client
bundle. Pushes to `main` redeploy automatically.

## What's on screen

| Section | What it shows |
| --- | --- |
| Grid Environment | Start, goal, obstacles, frontier (open list), visited cells, final path and the moving agent |
| Live Decision Log | Every node expanded with `g(n)`, `h(n)`, `f(n)`, every node pushed to the open list, and every rejected neighbour with its reason |
| Performance Metrics | Path cost, nodes expanded, nodes visited, execution time, final path length |
| PEAS Framework | Performance measure, environment, actuators, sensors |

Controls: **Start A\***, **Reset**, **Random Obstacles**, **Clear Obstacles**, plus a speed
slider. Click or drag on the grid to draw or erase obstacles before starting.

## The algorithm

`src/lib/algorithms/astar.ts` is pure TypeScript with no UI dependencies, so it can be read
and explained on its own.

- `f(n) = g(n) + h(n)`
- `g(n)` — cost from the start to the current node (1 per move)
- `h(n) = |x_goal - x_current| + |y_goal - y_current|` — Manhattan distance, admissible on a
  4-connected grid, so A\* returns an optimal path
- Moves: up, down, left, right, each costing 1
- Ties on `f` are broken by the lower `h`, which pushes the search towards the goal

The search runs to completion synchronously and records every decision as a `SearchEvent`.
The UI then replays that trace frame by frame — **the animation is the real execution**,
not a scripted approximation.

## Structure

```text
src/
  lib/
    algorithms/astar.ts   # A* search, UI-free
    grid.ts               # grid size, defaults, random obstacle generation
    types.ts              # shared types
    components/
      Grid.svelte         # grid rendering + obstacle painting
      Controls.svelte     # buttons and speed slider
      DecisionLog.svelte  # live reasoning feed
      Metrics.svelte      # performance tiles
      PeasPanel.svelte    # expandable PEAS section
      Legend.svelte       # colour key
  routes/+page.svelte     # orchestrates the run and the animation
```

## PEAS

- **Performance measure** — shortest valid path, low path cost, few explored nodes
- **Environment** — a fully observable, static, discrete 2D grid of free cells and obstacles
- **Actuators** — move up, down, left, right
- **Sensors** — current position, neighbouring cells, obstacle map, goal location
