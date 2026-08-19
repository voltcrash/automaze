/** Shared types for the A* grid navigation agent. */

/** A coordinate in the grid. `x` is the column, `y` is the row. */
export interface Point {
	x: number;
	y: number;
}

/** What a single grid cell contains. */
export type CellKind = 'free' | 'wall' | 'start' | 'goal';

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
export type LogKind = 'info' | 'expand' | 'open' | 'reject' | 'success' | 'error';

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
	| { type: 'expand'; node: SearchNode }
	| { type: 'open'; node: SearchNode }
	| { type: 'reject'; point: Point; reason: string }
	| { type: 'goal'; node: SearchNode }
	| { type: 'failure' };

/** Performance numbers reported once the search finishes. */
export interface Metrics {
	pathCost: number;
	nodesExpanded: number;
	nodesVisited: number;
	executionMs: number;
	pathLength: number;
}

/** Full result of running A* to completion. */
export interface SearchResult {
	found: boolean;
	path: Point[];
	events: SearchEvent[];
	metrics: Metrics;
}
