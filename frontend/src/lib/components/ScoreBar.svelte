<script lang="ts">
	interface Props {
		score: number;
		maxScore?: number;
		/** When set, bar uses min–max normalization: (score - minScore) / (maxScore - minScore) */
		minScore?: number;
	}
	let { score, maxScore = 8, minScore }: Props = $props();

	const pct = $derived.by(() => {
		if (minScore !== undefined && maxScore !== undefined) {
			const range = maxScore - minScore;
			if (range <= 0) return 100;
			return Math.min(Math.max(((score - minScore) / range) * 100, 0), 100);
		}
		return Math.min((score / maxScore) * 100, 100);
	});

	/** Display value: normalized (x/max) when maxScore is set, else raw score */
	const displayValue = $derived(
		maxScore != null && maxScore > 0 ? (score / maxScore).toFixed(2) : score.toFixed(2)
	);
</script>

<div class="mt-1.5 flex items-center gap-2">
	<div class="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
		<div
			class="h-full rounded-full bg-accent transition-all duration-500"
			style="width: {pct}%"
		></div>
	</div>
	<span class="text-xs tabular-nums text-text-secondary">{displayValue}</span>
</div>
