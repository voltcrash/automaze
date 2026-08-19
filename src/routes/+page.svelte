<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { aStar, key } from '$lib/algorithms/astar';
	import {
		DEFAULT_GOAL,
		DEFAULT_START,
		GRID_HEIGHT,
		GRID_WIDTH,
		createWalls,
		randomWalls,
		samePoint
	} from '$lib/grid';
	import Controls from '$lib/components/Controls.svelte';
	import DecisionLog from '$lib/components/DecisionLog.svelte';
	import Grid from '$lib/components/Grid.svelte';
	import Legend from '$lib/components/Legend.svelte';
	import Metrics from '$lib/components/Metrics.svelte';
	import PeasPanel from '$lib/components/PeasPanel.svelte';
	import type { LogEntry, LogKind, Metrics as MetricsType, Point } from '$lib/types';

	const start = DEFAULT_START;
	const goal = DEFAULT_GOAL;

	let walls = $state(randomWalls(start, goal, 0.22));

	// Visual state, all driven by real events emitted by the A* run.
	let visited = new SvelteSet<string>();
	let frontier = new SvelteSet<string>();
	let path = new SvelteSet<string>();
	let agent = $state<Point | null>(null);

	let logs = $state<LogEntry[]>([]);
	let metrics = $state<MetricsType | null>(null);
	let found = $state(false);
	let running = $state(false);
	let speed = $state(30);

	let logId = 0;
	/** Incremented on every reset/start so stale animation loops bail out. */
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
		path.clear();
		agent = null;
		logs = [];
		logId = 0;
		metrics = null;
		found = false;
	}

	function toggleWall(p: Point) {
		if (running) return;
		if (samePoint(p, start) || samePoint(p, goal)) return;
		walls[p.y][p.x] = !walls[p.y][p.x];
	}

	async function startSearch() {
		clearRun();
		const token = runToken;
		running = true;

		log('info', `Agent online. Start (${start.x},${start.y}) → Goal (${goal.x},${goal.y}).`);
		log('info', 'Strategy: A* search, f(n) = g(n) + h(n), h = Manhattan distance.');

		// Run the real algorithm first; the animation below replays its trace.
		const result = aStar({ walls: walls.map((row) => [...row]), start, goal });

		for (const event of result.events) {
			if (token !== runToken) return; // a reset happened mid-animation

			switch (event.type) {
				case 'expand': {
					const { point, g, h, f } = event.node;
					frontier.delete(key(point));
					visited.add(key(point));
					agent = point;
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
					log('reject', `  ✕ (${event.point.x},${event.point.y}) rejected — ${event.reason}`);
					break;
				}
				case 'goal': {
					log('success', `Goal reached at (${event.node.point.x},${event.node.point.y})!`);
					break;
				}
				case 'failure': {
					log('error', 'Open list exhausted — no path to the goal.');
					break;
				}
			}
		}

		metrics = result.metrics;
		found = result.found;

		if (!result.found) {
			running = false;
			return;
		}

		// Walk the agent along the reconstructed path, one cell at a time.
		log('info', `Reconstructing path (${result.path.length} cells) and walking it…`);
		for (const step of result.path) {
			if (token !== runToken) return;
			path.add(key(step));
			agent = step;
			await sleep(Math.max(20, speed * 1.5));
		}

		log('success', `Final path cost: ${result.metrics.pathCost} (1 per move).`);
		log(
			'info',
			`Expanded ${result.metrics.nodesExpanded} nodes in ${result.metrics.executionMs.toFixed(2)} ms.`
		);
		running = false;
	}

	function reset() {
		clearRun();
	}

	function generateObstacles() {
		clearRun();
		walls = randomWalls(start, goal);
	}

	function clearObstacles() {
		clearRun();
		walls = createWalls();
	}
</script>

<svelte:head>
	<title>A* Grid Navigation Agent</title>
	<meta name="description" content="An autonomous A* pathfinding agent running entirely in the browser." />
</svelte:head>

<main>
	<header>
		<div>
			<h1>A* Grid Navigation Agent</h1>
			<p>
				An autonomous agent that searches a {GRID_WIDTH}×{GRID_HEIGHT} grid for the shortest
				obstacle-free path — algorithm, reasoning and metrics all in the browser.
			</p>
		</div>
		<span class="status" class:live={running}>{running ? 'SEARCHING' : 'IDLE'}</span>
	</header>

	<section class="panel controls-panel">
		<Controls
			{running}
			{speed}
			onStart={startSearch}
			onReset={reset}
			onRandom={generateObstacles}
			onClear={clearObstacles}
			onSpeed={(ms) => (speed = ms)}
		/>
		<p class="hint">Click or drag on the grid to add and remove obstacles before starting.</p>
	</section>

	<div class="layout">
		<section class="panel grid-panel">
			<h2>Grid Environment</h2>
			<Grid
				{walls}
				{start}
				{goal}
				{visited}
				{frontier}
				{path}
				{agent}
				editable={!running}
				onToggle={toggleWall}
			/>
			<Legend />
		</section>

		<div class="side">
			<DecisionLog entries={logs} />
			<Metrics {metrics} {found} />
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
		max-width: 62ch;
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

	.grid-panel {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
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
