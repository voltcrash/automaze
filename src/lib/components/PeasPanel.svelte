<script lang="ts">
	const peas = [
		{
			title: 'Performance Measure',
			body: 'All packages delivered to the correct bay, lowest total path cost, fewest nodes expanded per leg.'
		},
		{
			title: 'Environment',
			body: 'A fully observable, static, discrete grid warehouse: floor aisles, static shelf racks, packages and loading bays.'
		},
		{
			title: 'Actuators',
			body: 'Drive up, down, left or right (each move costs 1), pick up a package, drop it at a bay.'
		},
		{
			title: 'Sensors',
			body: 'Own position and load state, the four neighbouring cells, the shelf map, package positions and bay locations.'
		}
	];
</script>

<details class="panel">
	<summary>PEAS Framework</summary>
	<dl>
		{#each peas as item (item.title)}
			<dt>{item.title}</dt>
			<dd>{item.body}</dd>
		{/each}
	</dl>
</details>

<style>
	summary {
		cursor: pointer;
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	summary::marker {
		color: var(--accent);
	}

	dl {
		margin: 0.9rem 0 0;
		display: grid;
		gap: 0.6rem;
	}

	dt {
		font-weight: 600;
		font-size: 0.82rem;
		color: var(--accent);
	}

	dd {
		margin: 0.15rem 0 0;
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.5;
	}
</style>
