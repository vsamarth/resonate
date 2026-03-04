<script lang="ts">
	import type { Artist } from '$lib/types';
	import ScoreBar from './ScoreBar.svelte';
	import ArtistImage from './ArtistImage.svelte';

	interface Props {
		artist: Artist;
		score?: number;
		reason?: string;
		showScore?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let {
		artist,
		score,
		reason,
		showScore = false,
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
		<!-- Hover overlay -->
		<div class="absolute inset-0 rounded-card bg-black/0 transition-colors duration-200 group-hover:bg-black/20 pointer-events-none"></div>
	</div>

	<!-- Info -->
	<div class="mt-2 px-0.5">
		<p class="truncate text-sm font-medium text-white leading-tight">{artist.name}</p>
		{#if reason}
			<p class="mt-0.5 truncate text-xs text-text-secondary">{reason}</p>
		{:else}
			<p class="mt-0.5 text-xs text-text-secondary">{artist.genre}</p>
		{/if}
		{#if showScore && score !== undefined}
			<ScoreBar {score} />
		{/if}
	</div>
</a>
