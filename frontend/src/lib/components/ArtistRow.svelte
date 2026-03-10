<script lang="ts">
	import type { Artist, Recommendation } from '$lib/types';
	import ArtistCard from './ArtistCard.svelte';

	interface Props {
		title: string;
		subtitle?: string;
		items: Artist[] | Recommendation[];
		showScore?: boolean;
		showCategory?: boolean;
		/** Min/max scores for normalizing the bar (e.g. from the current list). */
		scoreMin?: number;
		scoreMax?: number;
		seeAllHref?: string;
		cardSize?: 'sm' | 'md' | 'lg';
	}

	let {
		title,
		subtitle,
		items,
		showScore = false,
		showCategory = true,
		scoreMin,
		scoreMax,
		seeAllHref,
		cardSize = 'md'
	}: Props = $props();

	function isRec(item: Artist | Recommendation): item is Recommendation {
		return 'score' in item;
	}
</script>

<section class="mb-8">
	<!-- Header -->
	<div class="mb-4 flex items-end justify-between px-1">
		<div>
			<h2 class="text-xl font-semibold text-white">{title}</h2>
			{#if subtitle}
				<p class="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
			{/if}
		</div>
		{#if seeAllHref}
			<a
				href={seeAllHref}
				class="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
			>
				See All
			</a>
		{/if}
	</div>

	<!-- Horizontal scroll strip -->
	<div class="scroll-row flex gap-4 overflow-x-auto pb-2">
		{#each items as item}
			{#if isRec(item)}
				<ArtistCard
					artist={item.artist}
					score={item.score}
					reason={item.reason}
					showScore={showScore}
					showCategory={showCategory}
					scoreMin={scoreMin}
					scoreMax={scoreMax}
					size={cardSize}
				/>
			{:else}
				<ArtistCard artist={item} size={cardSize} />
			{/if}
		{/each}
	</div>
</section>
