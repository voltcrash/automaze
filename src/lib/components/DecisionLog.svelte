<script lang="ts">
	import type { LogEntry } from '$lib/types';

	interface Props {
		entries: LogEntry[];
	}

	let { entries }: Props = $props();

	let list: HTMLDivElement | null = $state(null);

	// Keep the newest reasoning line in view while the search runs.
	$effect(() => {
		entries.length;
		if (list) list.scrollTop = list.scrollHeight;
	});
</script>

<section class="panel log-panel">
	<h2>Live Decision Log</h2>
	<div class="log" bind:this={list}>
		{#each entries as entry (entry.id)}
			<div class="line {entry.kind}">
				<span class="idx">{entry.id.toString().padStart(3, '0')}</span>
				<span class="msg">{entry.message}</span>
			</div>
		{:else}
			<p class="empty">Waiting for the agent to start reasoning…</p>
		{/each}
	</div>
</section>

<style>
	.log-panel {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.log {
		flex: 1;
		overflow-y: auto;
		min-height: 260px;
		max-height: 52vh;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.74rem;
		line-height: 1.5;
	}

	.line {
		display: flex;
		gap: 0.6rem;
		padding: 1px 0;
		color: var(--muted);
	}

	.idx {
		color: #45527a;
		flex: none;
	}

	.expand {
		color: #9ec5ff;
	}
	.open {
		color: #7ddcc0;
	}
	.reject {
		color: #d1687f;
	}
	.success {
		color: #6ee7a0;
		font-weight: 600;
	}
	.error {
		color: #f87171;
		font-weight: 600;
	}
	.info {
		color: var(--muted);
	}

	.empty {
		color: #4a5876;
		font-style: italic;
	}
</style>
