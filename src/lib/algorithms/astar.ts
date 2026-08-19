import type { Metrics, Point, SearchEvent, SearchNode, SearchResult } from "$lib/types";

/** The four legal actuator moves. Each valid movement costs exactly 1. */
export const MOVES: ReadonlyArray<Point & { name: string }> = [
  { x: 0, y: -1, name: "UP" },
  { x: 0, y: 1, name: "DOWN" },
  { x: -1, y: 0, name: "LEFT" },
  { x: 1, y: 0, name: "RIGHT" },
];

/** Cost of one move between orthogonally adjacent cells. */
export const MOVE_COST = 1;

/** h(n) = |x_goal - x_current| + |y_goal - y_current| (Manhattan distance). */
export function manhattan(from: Point, to: Point): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}

/** Stable key for a coordinate, used for the open/closed lookup maps. */
export function key(p: Point): string {
  return `${p.x},${p.y}`;
}

/** Walk parent links back from the goal node to produce the final path. */
function reconstructPath(node: SearchNode): Point[] {
  const path: Point[] = [];
  let current: SearchNode | null = node;
  while (current) {
    path.push(current.point);
    current = current.parent;
  }
  return path.reverse();
}

export interface AStarInput {
  /** `walls[y][x] === true` means the cell is an obstacle. */
  walls: boolean[][];
  start: Point;
  goal: Point;
}

/**
 * A* search over a 4-connected grid.
 *
 * The function runs to completion synchronously and records every decision it
 * makes as a `SearchEvent`. The UI then animates those recorded events, so the
 * visualisation is a faithful replay of the real search.
 */
export function aStar({ walls, start, goal }: AStarInput): SearchResult {
  const startedAt = performance.now();

  const height = walls.length;
  const width = height > 0 ? walls[0].length : 0;
  const inBounds = (p: Point) => p.x >= 0 && p.y >= 0 && p.x < width && p.y < height;

  const events: SearchEvent[] = [];

  // Open list: nodes discovered but not yet expanded, keyed by coordinate so
  // we can cheaply check whether a better path to a cell already exists.
  const open = new Map<string, SearchNode>();
  // Closed list: coordinates already expanded — never revisited.
  const closed = new Set<string>();

  const startNode: SearchNode = {
    point: start,
    g: 0,
    h: manhattan(start, goal),
    f: manhattan(start, goal),
    parent: null,
  };
  open.set(key(start), startNode);
  events.push({ type: "open", node: startNode });

  let nodesExpanded = 0;

  while (open.size > 0) {
    // Select the open node with the lowest f(n); ties broken by lower h(n),
    // which nudges the search towards the goal and keeps the demo tidy.
    let current: SearchNode | null = null;
    for (const node of open.values()) {
      if (!current || node.f < current.f || (node.f === current.f && node.h < current.h)) {
        current = node;
      }
    }
    if (!current) break;

    open.delete(key(current.point));
    closed.add(key(current.point));
    nodesExpanded++;
    events.push({ type: "expand", node: current });

    // Goal test happens on expansion, which is what makes A* optimal here.
    if (current.point.x === goal.x && current.point.y === goal.y) {
      events.push({ type: "goal", node: current });
      const path = reconstructPath(current);
      const metrics: Metrics = {
        pathCost: current.g,
        nodesExpanded,
        nodesVisited: closed.size,
        executionMs: performance.now() - startedAt,
        pathLength: path.length,
      };
      return { found: true, path, events, metrics };
    }

    // Expand the four neighbours.
    for (const move of MOVES) {
      const next: Point = { x: current.point.x + move.x, y: current.point.y + move.y };

      if (!inBounds(next)) {
        events.push({ type: "reject", point: next, reason: "outside grid" });
        continue;
      }
      if (walls[next.y][next.x]) {
        events.push({ type: "reject", point: next, reason: "obstacle" });
        continue;
      }
      if (closed.has(key(next))) {
        events.push({ type: "reject", point: next, reason: "already expanded" });
        continue;
      }

      // g(n) of the neighbour through the current node.
      const g = current.g + MOVE_COST;
      const existing = open.get(key(next));
      if (existing && existing.g <= g) {
        // A cheaper (or equal) route to this cell is already queued.
        events.push({ type: "reject", point: next, reason: "costlier than known path" });
        continue;
      }

      const h = manhattan(next, goal);
      const node: SearchNode = { point: next, g, h, f: g + h, parent: current };
      open.set(key(next), node);
      events.push({ type: "open", node });
    }
  }

  // Open list exhausted without reaching the goal — no path exists.
  events.push({ type: "failure" });
  return {
    found: false,
    path: [],
    events,
    metrics: {
      pathCost: 0,
      nodesExpanded,
      nodesVisited: closed.size,
      executionMs: performance.now() - startedAt,
      pathLength: 0,
    },
  };
}
