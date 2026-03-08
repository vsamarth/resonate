<script lang="ts">
	import type { PageData } from './$types';
	import { fetchRecommendations } from '$lib/api/recommendations';
	import type { Recommendation } from '$lib/types';
	import ArtistRow from '$lib/components/ArtistRow.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { ArrowLeft, Music2 } from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const user = $derived(data.user);

	let recs = $state<Recommendation[]>([]);
	let recsLoading = $state(true);

	$effect(() => {
		const userIdx = user.userIdx;
		recsLoading = true;
		fetchRecommendations(userIdx, 10).then((items) => {
			recs = items;
			recsLoading = false;
		});
	});

	const maxPlays = $derived(user.topArtists[0]?.plays ?? 1);

	function formatPlays(n: number): string {
		if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
		return n.toString();
	}
</script>

<div class="min-h-screen px-8 py-10">
	<!-- Back -->
	<button
		onclick={() => history.back()}
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-white transition-colors"
	>
		<ArrowLeft class="h-4 w-4" />
		Back
	</button>

	<!-- Profile header -->
	<div class="mb-10 flex items-center gap-6">
		<UserAvatar {user} size="xl" />
		<div>
			<h1 class="text-4xl font-bold text-white">{user.displayName}</h1>
			<p class="mt-1 font-mono text-sm text-text-secondary">sha1: {user.sha1}…</p>
			<div class="mt-3 flex items-center gap-2">
				<Music2 class="h-4 w-4 text-accent" />
				<span class="text-sm text-text-secondary">
					{user.topArtists.length} artists · {user.topArtists
						.reduce((s, ta) => s + ta.plays, 0)
						.toLocaleString()} total plays
				</span>
			</div>
		</div>
	</div>

	<!-- Your Artists with play-count rings -->
	<section class="mb-10">
		<h2 class="mb-5 text-xl font-semibold text-white">Your Artists</h2>
		<div class="flex flex-wrap gap-6">
			{#each user.topArtists as ta}
				{@const ringPct = (ta.plays / maxPlays) * 100}
				{@const px = 80}
				{@const strokeW = 3}
				{@const r = (px - strokeW) / 2}
				{@const circ = 2 * Math.PI * r}
				{@const dashOffset = circ * (1 - ringPct / 100)}
				<a href="/artist/{ta.artist.mbid}" class="group flex flex-col items-center gap-2">
					<!-- Ring + circle -->
					<div class="relative" style="width:{px}px;height:{px}px">
						<svg
							class="absolute inset-0"
							width={px}
							height={px}
							viewBox="0 0 {px} {px}"
							style="transform:rotate(-90deg)"
						>
							<circle cx={px/2} cy={px/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" stroke-width={strokeW} />
							<circle cx={px/2} cy={px/2} r={r} fill="none" stroke="#FC3C44" stroke-width={strokeW}
								stroke-dasharray={circ} stroke-dashoffset={dashOffset} stroke-linecap="round" />
						</svg>
						<div class="absolute inset-[5px] flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br {ta.artist.gradient} transition-transform duration-200 group-hover:scale-105">
							<span class="text-2xl font-bold text-white/80 select-none">{ta.artist.name[0]}</span>
						</div>
					</div>
					<div class="text-center w-20">
						<p class="text-xs font-medium text-white leading-tight line-clamp-2">{ta.artist.name}</p>
						<p class="text-xs text-text-secondary mt-0.5">{formatPlays(ta.plays)}</p>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- Listening History table -->
	<section class="mb-10">
		<h2 class="mb-4 text-xl font-semibold text-white">Listening History</h2>
		<div class="overflow-hidden rounded-xl border border-white/5 bg-base-card">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-white/5 text-left">
						<th class="px-4 py-3 font-medium text-text-secondary w-10">#</th>
						<th class="px-4 py-3 font-medium text-text-secondary">Artist</th>
						<th class="px-4 py-3 font-medium text-text-secondary">Genre</th>
						<th class="px-4 py-3 font-medium text-text-secondary text-right">Plays</th>
					</tr>
				</thead>
				<tbody>
					{#each user.topArtists as ta, i}
						<tr class="border-b border-white/5 last:border-0 transition-colors hover:bg-white/5">
							<td class="px-4 py-3 text-text-tertiary">{i + 1}</td>
							<td class="px-4 py-3">
								<a href="/artist/{ta.artist.mbid}" class="flex items-center gap-3 group">
									<div
										class="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br {ta.artist.gradient} flex items-center justify-center text-sm font-bold text-white/70"
									>
										{ta.artist.name[0]}
									</div>
									<span class="font-medium text-white group-hover:text-accent transition-colors">{ta.artist.name}</span>
								</a>
							</td>
							<td class="px-4 py-3 text-text-secondary">{ta.artist.genre}</td>
							<td class="px-4 py-3 text-right">
								<span class="font-semibold text-white">{ta.plays.toLocaleString()}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Recommendations -->
	{#if recsLoading}
		<div class="mb-10">
			<p class="text-sm text-text-secondary animate-pulse">Loading recommendations…</p>
		</div>
	{:else if recs.length > 0}
		<ArtistRow
			title="Made For You"
			subtitle="Top picks from the LightGCN model"
			items={recs}
			showScore={true}
			cardSize="md"
		/>
	{/if}
</div>
