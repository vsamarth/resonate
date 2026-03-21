<script lang="ts">
	import { getArtistImage } from '$lib/api/wikipedia';
	import { isPlaceholderArtistImageUrl } from '$lib/artist-image-url';

	interface Props {
		artistName: string;
		/** MusicBrainz id — used to load art from Last.fm via `/api/artists/image` */
		mbid?: string;
		gradient: string;
		/** If you already have the URL (e.g. from a page load), pass it directly */
		preloadedUrl?: string | null;
		/** Tailwind height class e.g. "h-44" */
		heightClass?: string;
		rounded?: string;
	}

	let {
		artistName,
		mbid = undefined,
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
			const ok = preloadedUrl != null && !isPlaceholderArtistImageUrl(preloadedUrl);
			if (ok) {
				imageUrl = preloadedUrl;
				loaded = true;
				return;
			}
			// Server had no art — still try Last.fm → Wikipedia client-side
		}
		loaded = false;
		errored = false;
		imageUrl = null;

		let cancelled = false;

		(async () => {
			if (mbid?.trim()) {
				try {
					const q = new URLSearchParams({ mbid: mbid.trim() });
					if (artistName.trim()) q.set('name', artistName.trim());
					const r = await fetch(`/api/artists/image?${q}`);
					if (!cancelled && r.ok) {
						const j = (await r.json()) as { url: string | null };
						if (j.url && !isPlaceholderArtistImageUrl(j.url)) {
							imageUrl = j.url;
							return;
						}
					}
				} catch {
					/* fall through to Wikipedia */
				}
			}
			if (!cancelled) {
				const url = await getArtistImage(artistName);
				if (!cancelled) {
					imageUrl = url && !isPlaceholderArtistImageUrl(url) ? url : null;
				}
			}
		})();

		return () => {
			cancelled = true;
		};
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
