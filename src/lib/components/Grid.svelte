<script lang="ts">
	import { key } from '$lib/algorithms/astar';
	import { samePoint } from '$lib/grid';
	import type { Point } from '$lib/types';

	interface Props {
		walls: boolean[][];
		start: Point;
		goal: Point;
		/** Cells already expanded by the search. */
		visited: Set<string>;
		/** Cells currently sitting in the open list (frontier). */
		frontier: Set<string>;
		/** Cells belonging to the final path. */
		path: Set<string>;
		/** Where the agent currently stands, if it is moving. */
		agent: Point | null;
		/** Editing is only allowed while the search is idle. */
		editable: boolean;
		onToggle: (p: Point) => void;
	}

	let { walls, start, goal, visited, frontier, path, agent, editable, onToggle }: Props = $props();

	let painting = $state(false);

	function cellClass(x: number, y: number): string {
		const p = { x, y };
		const k = key(p);
		if (agent && samePoint(p, agent)) return 'cell agent';
		if (samePoint(p, start)) return 'cell start';
		if (samePoint(p, goal)) return 'cell goal';
		if (walls[y][x]) return 'cell wall';
		if (path.has(k)) return 'cell path';
		if (visited.has(k)) return 'cell visited';
		if (frontier.has(k)) return 'cell frontier';
		return 'cell';
	}
</script>

<div
	class="grid"
	style="--cols: {walls[0].length}"
	role="grid"
	tabindex="-1"
	onpointerleave={() => (painting = false)}
	onpointerup={() => (painting = false)}
>
	{#each walls as row, y (y)}
		{#each row as _cell, x (x)}
			<button
				type="button"
				class={cellClass(x, y)}
				disabled={!editable}
				aria-label={`cell ${x},${y}`}
				onpointerdown={() => {
					painting = true;
					onToggle({ x, y });
				}}
				onpointerenter={() => painting && onToggle({ x, y })}
			></button>
		{/each}
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		gap: 2px;
		background: #0e1421;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 6px;
		touch-action: none;
	}

	.cell {
		all: unset;
		aspect-ratio: 1 / 1;
		border-radius: 3px;
		background: #172033;
		transition: background 90ms linear;
	}

	.cell:not(:disabled):hover {
		background: #223052;
		cursor: pointer;
	}

	.wall {
		background: var(--wall);
	}
	.visited {
		background: var(--visited);
	}
	.frontier {
		background: var(--open);
	}
	.path {
		background: var(--path);
	}
	.start {
		background: var(--start);
	}
	.goal {
		background: var(--goal);
	}
	.agent {
		background: var(--agent);
		box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.35);
	}
</style>
