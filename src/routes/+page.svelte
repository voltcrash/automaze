<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { key } from '$lib/algorithms/astar';
	import { planMission } from '$lib/algorithms/mission';
	import {
		FORKLIFT_HOME,
		WAREHOUSE_HEIGHT,
		WAREHOUSE_WIDTH,
		createEmptyWarehouse,
		createPackages,
		createWarehouse,
		samePoint
	} from '$lib/warehouse';
	import Controls from '$lib/components/Controls.svelte';
	import DecisionLog from '$lib/components/DecisionLog.svelte';
	import Legend from '$lib/components/Legend.svelte';
	import Metrics from '$lib/components/Metrics.svelte';
	import PeasPanel from '$lib/components/PeasPanel.svelte';
	import Warehouse from '$lib/components/Warehouse.svelte';
	import type { LogEntry, LogKind, MissionTotals, Package, Point } from '$lib/types';

	// Held separately so the initial view state below reads a plain object rather
	// than the reactive proxy (which would only capture its first value).
	const initialWarehouse = createWarehouse();

	let warehouse = $state(initialWarehouse);

	// Live view state, all driven by the recorded A* traces.
	let visited = new SvelteSet<string>();
	let frontier = new SvelteSet<string>();
	let route = new SvelteSet<string>();
	let forklift = $state<Point>(initialWarehouse.forklift);
	let carrying = $state<string | null>(null);
	/** Packages not yet picked up — removed from the floor as they are collected. */
	let onFloor = $state<Package[]>([...initialWarehouse.packages]);

	let logs = $state<LogEntry[]>([]);
	let totals = $state<MissionTotals | null>(null);
	let unreachable = $state<string[]>([]);
	let running = $state(false);
	let speed = $state(24);
	let currentTask = $state('Idle — forklift parked at the dock');

	let logId = 0;
	/** Incremented on reset/start so stale animation loops bail out. */
	let runToken = 0;

	function log(kind: LogKind, message: string) {
		logs.push({ id: ++logId, kind, message });
	}

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	function clearRun() {
		runToken++;
		running = false;
		visited.clear();
		frontier.clear();
		route.clear();
		forklift = warehouse.forklift;
		carrying = null;
		onFloor = [...warehouse.packages];
		logs = [];
		logId = 0;
		totals = null;
		unreachable = [];
		currentTask = 'Idle — forklift parked at the dock';
	}

	function toggleShelf(p: Point) {
		if (running) return;
		if (samePoint(p, FORKLIFT_HOME)) return;
		if (warehouse.bays.some((b) => samePoint(b.at, p))) return;
		if (warehouse.packages.some((pkg) => samePoint(pkg.at, p))) return;
		warehouse.shelves[p.y][p.x] = !warehouse.shelves[p.y][p.x];
	}

	async function startShift() {
		clearRun();
		const token = runToken;
		running = true;

		log('info', `Shift started. Manifest: ${warehouse.packages.length} packages.`);
		for (const pkg of warehouse.packages) {
			log('info', `  ${pkg.id} at (${pkg.at.x},${pkg.at.y}) → ${pkg.bayId}`);
		}
		log('info', 'Planner: A* per leg, f(n) = g(n) + h(n), h = Manhattan distance.');

		// Plan the entire shift up front, then replay the recorded searches.
		const mission = planMission($state.snapshot(warehouse));
		unreachable = mission.unreachable;

		for (const leg of mission.legs) {
			if (token !== runToken) return;

			visited.clear();
			frontier.clear();
			route.clear();

			currentTask =
				leg.kind === 'pickup'
					? `Driving to ${leg.packageId} at (${leg.to.x},${leg.to.y})`
					: `Carrying ${leg.packageId} to ${leg.bayId}`;

			log(
				'info',
				leg.kind === 'pickup'
					? `▸ Leg: fetch ${leg.packageId} — (${leg.from.x},${leg.from.y}) → (${leg.to.x},${leg.to.y})`
					: `▸ Leg: deliver ${leg.packageId} to ${leg.bayId} — (${leg.from.x},${leg.from.y}) → (${leg.to.x},${leg.to.y})`
			);

			// Replay the search for this leg.
			for (const event of leg.result.events) {
				if (token !== runToken) return;

				switch (event.type) {
					case 'expand': {
						const { point, g, h, f } = event.node;
						frontier.delete(key(point));
						visited.add(key(point));
						log('expand', `Exploring (${point.x},${point.y}) — g=${g}, h=${h}, f=${g}+${h}=${f}`);
						await sleep(speed);
						break;
					}
					case 'open': {
						const { point, g, h, f } = event.node;
						if (!visited.has(key(point))) frontier.add(key(point));
						log('open', `  ↳ open list ← (${point.x},${point.y}) g=${g} h=${h} f=${f}`);
						break;
					}
					case 'reject': {
						const reason = event.reason === 'obstacle' ? 'shelf rack' : event.reason;
						log('reject', `  ✕ (${event.point.x},${event.point.y}) rejected — ${reason}`);
						break;
					}
					case 'goal': {
						log('success', `Optimal route found — cost ${leg.result.metrics.pathCost}.`);
						break;
					}
					case 'failure': {
						log('error', 'Open list exhausted — no route.');
						break;
					}
				}
			}

			// Drive the forklift along the optimal route, one cell at a time.
			for (const step of leg.result.path) {
				if (token !== runToken) return;
				route.add(key(step));
				forklift = step;
				await sleep(Math.max(18, speed * 1.4));
			}

			if (leg.kind === 'pickup') {
				carrying = leg.packageId;
				onFloor = onFloor.filter((pkg) => pkg.id !== leg.packageId);
				log('success', `Picked up ${leg.packageId}.`);
			} else {
				carrying = null;
				log('success', `Delivered ${leg.packageId} to ${leg.bayId}.`);
			}
		}

		totals = mission.totals;

		for (const id of mission.unreachable) {
			log('error', `${id} is walled in by shelves — skipped.`);
		}

		log(
			'success',
			`Shift complete: ${mission.totals.deliveries}/${warehouse.packages.length} delivered, total path cost ${mission.totals.pathCost}.`
		);
		log(
			'info',
			`Expanded ${mission.totals.nodesExpanded} nodes across ${mission.totals.legs} A* searches in ${mission.totals.executionMs.toFixed(2)} ms.`
		);

		currentTask = `Shift complete — ${mission.totals.deliveries} delivered`;
		running = false;
	}

	function newWarehouse() {
		warehouse = createWarehouse();
		clearRun();
	}

	function clearRacks() {
		warehouse = createEmptyWarehouse();
		clearRun();
	}

	function reset() {
		// Same floorplan and racks, a fresh manifest of packages.
		warehouse.packages = createPackages(warehouse.shelves, warehouse.bays);
		clearRun();
	}
</script>

<svelte:head>
	<title>Warehouse Logistics Agent — A* Search</title>
	<meta
		name="description"
		content="An autonomous forklift agent that plans package deliveries with A* search, entirely in the browser."
	/>
</svelte:head>

<main>
	<header>
		<div>
			<h1>Warehouse Logistics Agent</h1>
			<p>
				An autonomous forklift collects packages and delivers them to loading bays across a {WAREHOUSE_WIDTH}×{WAREHOUSE_HEIGHT}
				warehouse of static shelf racks, planning every leg with A* search and Manhattan distance.
			</p>
		</div>
		<span class="status" class:live={running}>{running ? 'ON SHIFT' : 'IDLE'}</span>
	</header>

	<section class="panel controls-panel">
		<Controls
			{running}
			{speed}
			onStart={startShift}
			onReset={reset}
			onRandom={newWarehouse}
			onClear={clearRacks}
			onSpeed={(ms) => (speed = ms)}
		/>
		<p class="hint">Click or drag on the floor to add and remove shelf racks between shifts.</p>
	</section>

	<div class="layout">
		<section class="panel floor-panel">
			<div class="floor-head">
				<h2>Warehouse Floor</h2>
				<span class="task" class:live={running}>{currentTask}</span>
			</div>
			<Warehouse
				shelves={warehouse.shelves}
				bays={warehouse.bays}
				packages={onFloor}
				{visited}
				{frontier}
				path={route}
				{forklift}
				{carrying}
				editable={!running}
				onToggleShelf={toggleShelf}
			/>
			<Legend />
		</section>

		<div class="side">
			<DecisionLog entries={logs} />
			<Metrics metrics={totals} {unreachable} packageCount={warehouse.packages.length} />
			<PeasPanel />
		</div>
	</div>
</main>

<style>
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem 1.5rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		letter-spacing: -0.01em;
	}

	header p {
		margin: 0.35rem 0 0;
		color: var(--muted);
		font-size: 0.86rem;
		max-width: 70ch;
	}

	.status {
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		padding: 0.35rem 0.6rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		color: var(--muted);
		flex: none;
	}

	.status.live {
		color: #06101f;
		background: var(--accent);
		border-color: var(--accent);
	}

	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.hint {
		margin: 0;
		font-size: 0.76rem;
		color: var(--muted);
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 380px;
		gap: 1rem;
		align-items: start;
	}

	.floor-panel {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.floor-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.floor-head h2 {
		margin: 0;
	}

	.task {
		font-size: 0.78rem;
		color: var(--muted);
	}

	.task.live {
		color: var(--package);
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (max-width: 1080px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
