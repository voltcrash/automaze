<script lang="ts">
	const items = [
		{ label: 'Start', color: 'var(--start)' },
		{ label: 'Goal', color: 'var(--goal)' },
		{ label: 'Obstacle', color: 'var(--wall)' },
		{ label: 'Frontier (open list)', color: 'var(--open)' },
		{ label: 'Visited', color: 'var(--visited)' },
		{ label: 'Final path', color: 'var(--path)' },
		{ label: 'Agent', color: 'var(--agent)' }
	];
</script>

<ul class="legend">
	{#each items as item (item.label)}
		<li><span class="swatch" style="background: {item.color}"></span>{item.label}</li>
	{/each}
</ul>

<style>
	.legend {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		margin: 0;
		padding: 0;
		font-size: 0.76rem;
		color: var(--muted);
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.swatch {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		display: inline-block;
	}
</style>
