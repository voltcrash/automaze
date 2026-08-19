<script lang="ts">
	import type { MissionTotals } from '$lib/types';

	interface Props {
		metrics: MissionTotals | null;
		/** Packages the planner could not route to. */
		unreachable: string[];
		packageCount: number;
	}

	let { metrics, unreachable, packageCount }: Props = $props();

	const dash = '—';
</script>

<section class="panel">
	<h2>Shift Performance</h2>
	<div class="tiles">
		<div class="tile">
			<span class="label">Total path cost</span>
			<span class="value">{metrics ? metrics.pathCost : dash}</span>
		</div>
		<div class="tile">
			<span class="label">Deliveries</span>
			<span class="value">{metrics ? `${metrics.deliveries}/${packageCount}` : dash}</span>
		</div>
		<div class="tile">
			<span class="label">Nodes expanded</span>
			<span class="value">{metrics ? metrics.nodesExpanded : dash}</span>
		</div>
		<div class="tile">
			<span class="label">Nodes visited</span>
			<span class="value">{metrics ? metrics.nodesVisited : dash}</span>
		</div>
		<div class="tile">
			<span class="label">Execution time</span>
			<span class="value">{metrics ? `${metrics.executionMs.toFixed(2)} ms` : dash}</span>
		</div>
		<div class="tile">
			<span class="label">Cells driven</span>
			<span class="value">{metrics ? `${metrics.pathLength}` : dash}</span>
		</div>
		<div class="tile">
			<span class="label">A* legs</span>
			<span class="value">{metrics ? metrics.legs : dash}</span>
		</div>
	</div>
	{#if unreachable.length > 0}
		<p class="fail">
			Walled in by shelves, skipped: {unreachable.join(', ')}
		</p>
	{/if}
</section>

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: 0.5rem;
	}

	.tile {
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.6rem 0.7rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.value {
		font-size: 1.15rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.fail {
		margin: 0.75rem 0 0;
		color: #f87171;
		font-size: 0.82rem;
	}
</style>
