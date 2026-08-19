<script lang="ts">
	interface Props {
		running: boolean;
		speed: number;
		onStart: () => void;
		onReset: () => void;
		onRandom: () => void;
		onClear: () => void;
		onSpeed: (ms: number) => void;
	}

	let { running, speed, onStart, onReset, onRandom, onClear, onSpeed }: Props = $props();
</script>

<div class="controls">
	<button class="primary" onclick={onStart} disabled={running}>▶ Start A*</button>
	<button onclick={onReset}>↺ Reset</button>
	<button onclick={onRandom} disabled={running}>⚄ Random Obstacles</button>
	<button onclick={onClear} disabled={running}>✕ Clear Obstacles</button>

	<label class="speed">
		Speed
		<input
			type="range"
			min="5"
			max="150"
			step="5"
			value={speed}
			oninput={(e) => onSpeed(Number(e.currentTarget.value))}
		/>
	</label>
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: #06101f;
		font-weight: 600;
	}

	.primary:hover:not(:disabled) {
		background: #6ba0ff;
		border-color: #6ba0ff;
	}

	.speed {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
		font-size: 0.8rem;
		color: var(--muted);
	}

	input[type='range'] {
		accent-color: var(--accent);
		width: 130px;
		direction: rtl;
	}
</style>
