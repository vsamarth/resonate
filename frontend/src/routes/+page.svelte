<script lang="ts">
	import { activeUser } from '$lib/stores';
	import { getRecommendationsForUser } from '$lib/data/recommendations';
	import { trendingArtists } from '$lib/data/artists';
	import ArtistRow from '$lib/components/ArtistRow.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';

	function getGreeting(): string {
		const h = new Date().getHours();
		if (h < 12) return 'Good morning';
		if (h < 18) return 'Good afternoon';
		return 'Good evening';
	}

	const topArtists = $derived($activeUser.topArtists.map((ta) => ta.artist));
	const recs = $derived(getRecommendationsForUser($activeUser.id));
</script>

<div class="min-h-screen px-8 py-10">
	<!-- Header -->
	<div class="mb-10 flex items-center gap-4">
		<UserAvatar user={$activeUser} size="lg" />
		<div>
			<p class="text-sm text-text-secondary">{getGreeting()}</p>
			<h1 class="text-3xl font-bold text-white">{$activeUser.displayName}</h1>
		</div>
	</div>

	<!-- Your Top Artists -->
	<ArtistRow
		title="Your Top Artists"
		subtitle="Based on your listening history"
		items={topArtists}
		seeAllHref="/user/{$activeUser.id}"
		cardSize="md"
	/>

	<!-- Made For You -->
	{#if recs && recs.items.length > 0}
		<ArtistRow
			title="Made For You"
			subtitle="Personalized picks from the recommendation model"
			items={recs.items}
			showScore={true}
			seeAllHref="/user/{$activeUser.id}"
			cardSize="md"
		/>
	{/if}

	<!-- Trending -->
	<ArtistRow
		title="Trending on Last.fm"
		subtitle="Most played across the dataset"
		items={trendingArtists}
		cardSize="md"
	/>
</div>
