<script lang="ts">
	interface Props {
		score: number;
		maxScore?: number;
	}
	let { score, maxScore = 8 }: Props = $props();

	const pct = $derived(Math.min((score / maxScore) * 100, 100));
</script>

<div class="mt-1.5 flex items-center gap-2">
	<div class="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
		<div
			class="h-full rounded-full bg-accent transition-all duration-500"
			style="width: {pct}%"
		></div>
	</div>
	<span class="text-xs tabular-nums text-text-secondary">{score.toFixed(2)}</span>
</div>
