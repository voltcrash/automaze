<script lang="ts">
	const peas = [
		{
			title: 'Performance Measure',
			body: 'Shortest valid path to the goal, low total path cost, and as few explored nodes as possible.'
		},
		{
			title: 'Environment',
			body: 'A fully observable, static, discrete 2D grid of free cells and obstacles with a fixed start and goal.'
		},
		{ title: 'Actuators', body: 'Move up, move down, move left, move right — each move costs 1.' },
		{
			title: 'Sensors',
			body: 'Current position, the four neighbouring cells and their walkability, obstacle map, goal location.'
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
