<script lang="ts">
	import { key } from '$lib/algorithms/astar';
	import { samePoint } from '$lib/warehouse';
	import type { Bay, Package, Point } from '$lib/types';

	interface Props {
		shelves: boolean[][];
		bays: Bay[];
		/** Packages still waiting on the floor. */
		packages: Package[];
		/** Cells already expanded by the current A* leg. */
		visited: Set<string>;
		/** Cells on the open list of the current leg. */
		frontier: Set<string>;
		/** Cells on the optimal route being driven. */
		path: Set<string>;
		forklift: Point;
		/** Set while the forklift is carrying a package. */
		carrying: string | null;
		/** Racks can only be edited between shifts. */
		editable: boolean;
		onToggleShelf: (p: Point) => void;
	}

	let {
		shelves,
		bays,
		packages,
		visited,
		frontier,
		path,
		forklift,
		carrying,
		editable,
		onToggleShelf
	}: Props = $props();

	let painting = $state(false);

	const bayAt = (p: Point) => bays.find((b) => samePoint(b.at, p));
	const packageAt = (p: Point) => packages.find((pkg) => samePoint(pkg.at, p));

	function cellClass(x: number, y: number): string {
		const p = { x, y };
		const k = key(p);
		const classes = ['cell'];

		if (shelves[y][x]) classes.push('shelf');
		else if (path.has(k)) classes.push('route');
		else if (visited.has(k)) classes.push('visited');
		else if (frontier.has(k)) classes.push('frontier');

		if (bayAt(p)) classes.push('bay');
		if (packageAt(p)) classes.push('package');
		if (samePoint(p, forklift)) classes.push('forklift');
		if (samePoint(p, forklift) && carrying) classes.push('laden');

		return classes.join(' ');
	}

	function cellLabel(x: number, y: number): string {
		const p = { x, y };
		if (samePoint(p, forklift)) return carrying ? '▲' : '▼';
		const bay = bayAt(p);
		if (bay) return bay.id.slice(-1);
		if (packageAt(p)) return '▪';
		return '';
	}
</script>

<div
	class="floorplan"
	style="--cols: {shelves[0].length}"
	role="grid"
	tabindex="-1"
	onpointerleave={() => (painting = false)}
	onpointerup={() => (painting = false)}
>
	{#each shelves as row, y (y)}
		{#each row as _shelf, x (x)}
			<button
				type="button"
				class={cellClass(x, y)}
				disabled={!editable}
				aria-label={`cell ${x},${y}`}
				onpointerdown={() => {
					painting = true;
					onToggleShelf({ x, y });
				}}
				onpointerenter={() => painting && onToggleShelf({ x, y })}
			>
				{cellLabel(x, y)}
			</button>
		{/each}
	{/each}
</div>

<style>
	.floorplan {
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
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6rem;
		font-weight: 700;
		color: #06101f;
		transition: background 90ms linear;
	}

	.cell:not(:disabled):hover {
		background: #223052;
		cursor: pointer;
	}

	.shelf {
		background: var(--shelf);
	}
	.visited {
		background: var(--visited);
	}
	.frontier {
		background: var(--frontier);
	}
	.route {
		background: var(--route);
	}
	.bay {
		background: var(--bay);
	}
	.package {
		background: var(--package);
	}

	.forklift {
		background: var(--forklift);
		box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.35);
	}

	/* Carrying a package — ringed in the package colour. */
	.laden {
		box-shadow: 0 0 0 2px var(--package);
	}
</style>
