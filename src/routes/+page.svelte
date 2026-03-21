<script lang="ts">
	import type { PageData } from './$types';
	import { activeUser } from '$lib/stores';
	import { fetchRecommendations } from '$lib/api/recommendations';
	import { trendingArtists } from '$lib/data/artists';
	import type { Recommendation } from '$lib/types';
	import ArtistRow from '$lib/components/ArtistRow.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	function getGreeting(): string {
		const h = new Date().getHours();
		if (h < 12) return 'Good morning';
		if (h < 18) return 'Good afternoon';
		return 'Good evening';
	}

	const topArtists = $derived($activeUser?.topArtists?.map((ta) => ta.artist) ?? []);

	let recs = $state<Recommendation[]>([]);
	let recsLoading = $state(true);
	const recScoreMax = $derived(recs.length ? Math.max(...recs.map((r) => r.score)) : undefined);

	$effect(() => {
		const user = $activeUser;
		if (!user) return;
		recsLoading = true;
		fetchRecommendations(user.userIdx, 10).then((items) => {
			recs = items;
			recsLoading = false;
		});
	});
</script>

<div class="min-h-screen px-8 py-10">
	{#if $activeUser}
		<!-- Header -->
		<div class="mb-10 flex items-center gap-4">
			<UserAvatar user={$activeUser} size="lg" />
			<div>
				<p class="text-sm text-text-secondary">{getGreeting()}</p>
				<h1 class="text-3xl font-bold text-white">{$activeUser.displayName}</h1>
			</div>
		</div>

		<!-- Your Top Artists -->
		{#if topArtists.length > 0}
			<ArtistRow
				title="Your Top Artists"
				subtitle="Based on your listening history"
				items={topArtists}
				seeAllHref="/user/{$activeUser.id}"
				cardSize="md"
			/>
		{:else}
			<section class="mb-8">
				<h2 class="mb-4 text-xl font-semibold text-white">Your Top Artists</h2>
				<EmptyState
					title="No listening history yet"
					description="Your top artists will appear here once you have some plays."
				/>
			</section>
		{/if}

		<!-- Made For You -->
		{#if recsLoading}
			<section class="mb-8">
				<div class="mb-4 px-1">
					<h2 class="text-xl font-semibold text-white">Made For You</h2>
					<p class="mt-0.5 text-sm text-text-secondary">Personalized picks from Resonate</p>
				</div>
				<Skeleton variant="row" />
			</section>
		{:else if recs.length > 0}
			<ArtistRow
				title="Made For You"
				subtitle="Personalized picks from Resonate"
				items={recs}
				showScore={true}
				showCategory={false}
				scoreMax={recScoreMax}
				seeAllHref="/user/{$activeUser.id}"
				cardSize="md"
			/>
		{:else}
			<section class="mb-8">
				<div class="mb-4 px-1">
					<h2 class="text-xl font-semibold text-white">Made For You</h2>
					<p class="mt-0.5 text-sm text-text-secondary">Personalized picks from Resonate</p>
				</div>
				<EmptyState
					title="No recommendations yet"
					description="We need a bit more listening history to personalize your picks."
				/>
			</section>
		{/if}
	{:else if data.userDataStatus === 'database_unavailable'}
		<section class="mb-10 max-w-lg">
			<EmptyState
				title="Can’t load users"
				description="PostgreSQL isn’t reachable. Start your database and set DATABASE_URL in .env (see .env.example)."
			/>
		</section>
	{:else if data.userDataStatus === 'no_users'}
		<section class="mb-10 max-w-lg">
			<EmptyState
				title="No users in the database"
				description="Seed the dataset from the model/ folder — see model/README.md (e.g. uv run python scripts/seed_db.py)."
			/>
		</section>
	{:else}
		<!-- User loading skeleton -->
		<div class="mb-10 flex items-center gap-4">
			<Skeleton variant="avatar" class="h-16 w-16" />
			<div class="space-y-2">
				<Skeleton variant="text" class="h-3 w-24" />
				<Skeleton variant="text" class="h-8 w-48" />
			</div>
		</div>
		<section class="mb-8">
			<div class="mb-4 h-7 w-64">
				<Skeleton variant="text" class="h-full w-full" />
			</div>
			<Skeleton variant="row" />
		</section>
		<section class="mb-8">
			<div class="mb-4 h-7 w-40">
				<Skeleton variant="text" class="h-full w-full" />
			</div>
			<Skeleton variant="row" />
		</section>
	{/if}

	<!-- Trending -->
	<ArtistRow
		title="Trending on Last.fm"
		subtitle="Most played across the dataset"
		items={trendingArtists}
		cardSize="md"
	/>
</div>
