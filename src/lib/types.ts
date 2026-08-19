/** Shared types for the warehouse logistics agent. */

/** A coordinate in the grid. `x` is the column, `y` is the row. */
export interface Point {
  x: number;
  y: number;
}

/** What a single warehouse cell contains. Shelves are the static obstacles. */
export type CellKind = "floor" | "shelf";

/** A loading bay on the dock where packages must be delivered. */
export interface Bay {
  id: string;
  at: Point;
}

/** A package waiting on the warehouse floor, addressed to one loading bay. */
export interface Package {
  id: string;
  at: Point;
  /** `id` of the Bay this package must be delivered to. */
  bayId: string;
}

/** A complete warehouse: static shelf layout plus the things the agent acts on. */
export interface Warehouse {
  /** `shelves[y][x] === true` marks a static shelf obstacle. */
  shelves: boolean[][];
  bays: Bay[];
  packages: Package[];
  /** Where the forklift starts its shift. */
  forklift: Point;
}

/** A node considered by the search, carrying its A* scores. */
export interface SearchNode {
  point: Point;
  /** Cost of the cheapest known path from start to this node. */
  g: number;
  /** Manhattan distance heuristic from this node to the goal. */
  h: number;
  /** f(n) = g(n) + h(n) — estimated total path cost through this node. */
  f: number;
  /** Previous node on the cheapest known path (null for the start node). */
  parent: SearchNode | null;
}

/** Severity/category of a decision-log entry, used for colouring. */
export type LogKind = "info" | "expand" | "open" | "reject" | "success" | "error";

/** One line in the live decision log. */
export interface LogEntry {
  id: number;
  kind: LogKind;
  message: string;
}

/**
 * A single observable step of the algorithm. The UI replays these in order,
 * so what is drawn is always the real execution — nothing is faked.
 */
export type SearchEvent =
  | { type: "expand"; node: SearchNode }
  | { type: "open"; node: SearchNode }
  | { type: "reject"; point: Point; reason: string }
  | { type: "goal"; node: SearchNode }
  | { type: "failure" };

/** Performance numbers reported once the search finishes. */
export interface Metrics {
  pathCost: number;
  nodesExpanded: number;
  nodesVisited: number;
  executionMs: number;
  pathLength: number;
}

/** One A* run: either driving to a package, or carrying it to its bay. */
export type LegKind = "pickup" | "dropoff";

/** A single leg of the mission, backed by one complete A* search. */
export interface Leg {
  kind: LegKind;
  packageId: string;
  bayId: string;
  from: Point;
  to: Point;
  result: SearchResult;
}

/** Totals across every leg the forklift drives during a shift. */
export interface MissionTotals extends Metrics {
  deliveries: number;
  legs: number;
}

/** The full plan for a shift, produced before any animation starts. */
export interface Mission {
  legs: Leg[];
  totals: MissionTotals;
  /** Packages the forklift could not reach (walled in by shelves). */
  unreachable: string[];
}

/** Full result of running A* to completion. */
export interface SearchResult {
  found: boolean;
  path: Point[];
  events: SearchEvent[];
  metrics: Metrics;
}
