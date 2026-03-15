<script lang="ts">
	import { getArtistImage } from '$lib/api/wikipedia';

	interface Props {
		artistName: string;
		gradient: string;
		/** If you already have the URL (e.g. from a page load), pass it directly */
		preloadedUrl?: string | null;
		/** Tailwind height class e.g. "h-44" */
		heightClass?: string;
		rounded?: string;
	}

	let {
		artistName,
		gradient,
		preloadedUrl = undefined,
		heightClass = 'h-44',
		rounded = 'rounded-card'
	}: Props = $props();

	let imageUrl = $state<string | null>(null);
	let loaded = $state(false);
	let errored = $state(false);

	$effect(() => {
		// If a preloaded URL was passed, use it immediately.
		if (preloadedUrl !== undefined) {
			imageUrl = preloadedUrl;
			loaded = preloadedUrl != null;
			return;
		}
		// Otherwise lazy-fetch from Wikipedia on mount.
		loaded = false;
		errored = false;
		getArtistImage(artistName).then((url) => {
			imageUrl = url;
		});
	});
</script>

<div class="relative {heightClass} w-full overflow-hidden {rounded} bg-gradient-to-br {gradient}">
	<!-- Gradient placeholder / fallback -->
	<div
		class="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white/10 select-none transition-opacity duration-500
			{loaded && !errored ? 'opacity-0' : 'opacity-100'}"
	>
		{artistName[0].toUpperCase()}
	</div>

	<!-- Real image (fades in once loaded) -->
	{#if imageUrl && !errored}
		<img
			src={imageUrl}
			alt={artistName}
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500
				{loaded ? 'opacity-100' : 'opacity-0'}"
			onload={() => (loaded = true)}
			onerror={() => (errored = true)}
		/>
	{/if}
</div>
