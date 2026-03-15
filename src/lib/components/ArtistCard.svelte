<script lang="ts">
	import type { Artist } from '$lib/types';
	import ScoreBar from './ScoreBar.svelte';
	import ArtistImage from './ArtistImage.svelte';
	import { Play } from 'lucide-svelte';

	interface Props {
		artist: Artist;
		score?: number;
		reason?: string;
		showScore?: boolean;
		showCategory?: boolean;
		scoreMin?: number;
		scoreMax?: number;
		size?: 'sm' | 'md' | 'lg';
	}

	let {
		artist,
		score,
		reason,
		showScore = false,
		showCategory = true,
		scoreMin,
		scoreMax,
		size = 'md'
	}: Props = $props();

	const sizeClasses = { sm: 'w-36', md: 'w-44', lg: 'w-52' };
	const artSizeClasses = { sm: 'h-36', md: 'h-44', lg: 'h-52' };
</script>

<a
	href="/artist/{artist.mbid}"
	class="group flex flex-col {sizeClasses[size]} shrink-0 cursor-pointer"
>
	<!-- Artwork -->
	<div class="relative overflow-hidden rounded-card transition-transform duration-200 group-hover:scale-[1.03]">
		<ArtistImage
			artistName={artist.name}
			gradient={artist.gradient}
			heightClass={artSizeClasses[size]}
			rounded="rounded-card"
		/>
		<!-- Hover overlay + play icon -->
		<div class="absolute inset-0 rounded-card bg-black/0 transition-all duration-200 group-hover:bg-black/40 pointer-events-none flex items-center justify-center">
			<div class="opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg">
				<Play class="h-5 w-5 ml-0.5" fill="currentColor" />
			</div>
		</div>
	</div>

	<!-- Info -->
	<div class="mt-2 px-0.5">
		<p class="truncate text-sm font-medium text-white leading-tight">{artist.name}</p>
		{#if showCategory}
			{#if reason}
				<p class="mt-0.5 truncate text-xs text-text-secondary">{reason}</p>
			{:else}
				<p class="mt-0.5 text-xs text-text-secondary">{artist.genre}</p>
			{/if}
		{/if}
		{#if showScore && score !== undefined}
			<ScoreBar {score} minScore={scoreMin} maxScore={scoreMax} />
		{/if}
	</div>
</a>
