<script lang="ts">
	import type { PageData } from './$types';
	import { getSimilarArtists } from '$lib/data/artists';
	import { getTopListenersForArtist } from '$lib/data/users';
	import ArtistRow from '$lib/components/ArtistRow.svelte';
	import ArtistImage from '$lib/components/ArtistImage.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { ArrowLeft, Users, Play, Calendar, MapPin } from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const artist = $derived(data.artist);
	const imageUrl = $derived(data.imageUrl);
	const extract = $derived(data.extract);
	const mbTags = $derived(data.mbTags ?? []);
	const mbFormed = $derived(data.mbFormed);
	const mbType = $derived(data.mbType);
	const modelSimilar = $derived(data.modelSimilar ?? []);

	// Model similar artists take priority; fall back to static catalog similarMbids
	const staticSimilar = $derived(getSimilarArtists(artist.mbid));
	const similarArtists = $derived(modelSimilar.length > 0 ? modelSimilar : staticSimilar);

	const topListeners = $derived(getTopListenersForArtist(artist.mbid));

	// Top tags: prefer MusicBrainz tags, fall back to local genre (only if non-empty)
	const displayTags = $derived(
		mbTags.length > 0
			? mbTags.slice(0, 4).map((t) => t.name)
			: artist.genre
				? [artist.genre]
				: []
	);

	function formatPlays(n: number): string {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
		return n.toString();
	}

	// Country → flag emoji
	function countryFlag(code: string): string {
		if (!code || code.length !== 2) return '';
		return String.fromCodePoint(
			...code.toUpperCase().split('').map((c) => 0x1f1e0 + c.charCodeAt(0) - 65)
		);
	}

	const flag = $derived(countryFlag(artist.country));
	const countryDisplay = $derived(flag ? `${flag} ${artist.country}` : artist.country);
</script>

<div class="min-h-screen">
	<!-- Hero: real image if available, gradient fallback -->
	<div class="relative h-80 w-full overflow-hidden">
		<ArtistImage
			artistName={artist.name}
			gradient={artist.gradient}
			preloadedUrl={imageUrl}
			heightClass="h-80"
			rounded="rounded-none"
		/>
		<!-- Gradient scrim so text is always readable -->
		<div class="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent"></div>

		<!-- Back button -->
		<button
			onclick={() => history.back()}
			class="absolute left-6 top-6 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
		>
			<ArrowLeft class="h-4 w-4" />
			Back
		</button>

		<!-- Artist identity -->
		<div class="absolute bottom-6 left-8 right-8">
			<!-- Tags from MusicBrainz (or fallback genre) -->
			{#if displayTags.length > 0 || mbType}
				<div class="mb-2 flex flex-wrap items-center gap-2">
					{#each displayTags as tag}
						<span class="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm capitalize">
							{tag}
						</span>
					{/each}
					{#if mbType}
						<span class="rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-medium text-white/70">
							{mbType}
						</span>
					{/if}
				</div>
			{/if}
			<h1 class="text-5xl font-bold text-white drop-shadow-lg">{artist.name}</h1>
		</div>
	</div>

	<!-- Stats bar — only show stats with real data -->
	<div class="flex flex-wrap gap-6 border-b border-white/5 bg-base-card px-8 py-4">
		{#if artist.totalPlays > 0}
			<div class="flex items-center gap-2">
				<Play class="h-4 w-4 text-accent" />
				<div>
					<p class="text-xs text-text-secondary">Total Plays</p>
					<p class="text-sm font-semibold text-white">{formatPlays(artist.totalPlays)}</p>
				</div>
			</div>
		{/if}
		{#if artist.listenerCount > 0}
			<div class="flex items-center gap-2">
				<Users class="h-4 w-4 text-accent" />
				<div>
					<p class="text-xs text-text-secondary">Listeners</p>
					<p class="text-sm font-semibold text-white">{artist.listenerCount.toLocaleString()}</p>
				</div>
			</div>
		{/if}
		{#if mbFormed}
			<div class="flex items-center gap-2">
				<Calendar class="h-4 w-4 text-accent" />
				<div>
					<p class="text-xs text-text-secondary">Formed</p>
					<p class="text-sm font-semibold text-white">{mbFormed}</p>
				</div>
			</div>
		{/if}
		{#if artist.country}
			<div class="flex items-center gap-2">
				<MapPin class="h-4 w-4 text-accent" />
				<div>
					<p class="text-xs text-text-secondary">Country</p>
					<p class="text-sm font-semibold text-white">{countryDisplay}</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="px-8 py-8">
		<!-- Wikipedia bio -->
		{#if extract}
			<section class="mb-8 max-w-2xl">
				<h2 class="mb-3 text-xl font-semibold text-white">About</h2>
				<p class="text-sm leading-relaxed text-text-secondary">{extract}</p>
				<a
					href="https://en.wikipedia.org/wiki/{encodeURIComponent(artist.name)}"
					target="_blank"
					rel="noopener noreferrer"
					class="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
				>
					Read more on Wikipedia ↗
				</a>
			</section>
		{/if}

		<!-- All MusicBrainz genre tags -->
		{#if mbTags.length > 0}
			<section class="mb-8">
				<h2 class="mb-3 text-xl font-semibold text-white">Genres &amp; Tags</h2>
				<div class="flex flex-wrap gap-2">
					{#each mbTags.slice(0, 15) as tag}
						<span class="rounded-full bg-base-surface px-3 py-1 text-xs font-medium text-text-secondary capitalize hover:text-white transition-colors cursor-default">
							{tag.name}
						</span>
					{/each}
				</div>
				<p class="mt-2 text-xs text-text-tertiary">
					Via
					<a
						href="https://musicbrainz.org/artist/{artist.mbid}"
						target="_blank"
						rel="noopener noreferrer"
						class="text-accent hover:underline"
					>MusicBrainz</a>
				</p>
			</section>
		{/if}

		<!-- Similar artists: model embedding neighbours, fallback to static catalog -->
		{#if similarArtists.length > 0}
			<ArtistRow
				title="Listeners Also Like"
				subtitle={modelSimilar.length > 0
					? 'Nearest neighbours in LightGCN embedding space'
					: 'Similar artists'}
				items={similarArtists}
				cardSize="sm"
			/>
		{/if}

		<!-- Top Listeners (demo users only) -->
		{#if topListeners.length > 0}
			<section>
				<h2 class="mb-4 text-xl font-semibold text-white">Top Listeners</h2>
				<div class="flex flex-col gap-2 max-w-xl">
					{#each topListeners as { user, plays }, i}
						<a
							href="/user/{user.id}"
							class="flex items-center gap-4 rounded-xl bg-base-card px-4 py-3 transition-colors hover:bg-base-surface"
						>
							<span class="w-5 text-center text-sm font-medium text-text-tertiary">{i + 1}</span>
							<UserAvatar {user} size="sm" />
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-white">{user.displayName}</p>
								<p class="text-xs text-text-secondary">sha1: {user.sha1}…</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-semibold text-white">{plays.toLocaleString()}</p>
								<p class="text-xs text-text-secondary">plays</p>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>
