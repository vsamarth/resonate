<script lang="ts">
	import { artists } from '$lib/data/artists';
	import { users } from '$lib/data/users';
	import ArtistCard from '$lib/components/ArtistCard.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { Search } from 'lucide-svelte';

	let query = $state('');
	let activeTab = $state<'artists' | 'users'>('artists');
	let activeGenre = $state<string | null>(null);

	const allGenres = [...new Set(artists.map((a) => a.genre))].sort();

	const filteredArtists = $derived(
		artists.filter((a) => {
			const matchQuery =
				query.length === 0 || a.name.toLowerCase().includes(query.toLowerCase());
			const matchGenre = activeGenre === null || a.genre === activeGenre;
			return matchQuery && matchGenre;
		})
	);

	const filteredUsers = $derived(
		users.filter(
			(u) =>
				query.length === 0 ||
				u.displayName.toLowerCase().includes(query.toLowerCase()) ||
				u.sha1.includes(query.toLowerCase())
		)
	);
</script>

<div class="min-h-screen px-8 py-10">
	<!-- Search header -->
	<h1 class="mb-6 text-3xl font-bold text-white">Search</h1>

	<div class="relative mb-6 max-w-2xl">
		<Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
		<input
			type="text"
			placeholder="Artists, users…"
			bind:value={query}
			class="w-full rounded-2xl bg-base-surface py-3.5 pl-12 pr-4 text-white placeholder:text-text-secondary
				outline-none ring-1 ring-white/10 transition focus:ring-accent"
		/>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-1 rounded-xl bg-base-surface p-1 w-fit">
		{#each (['artists', 'users'] as const) as tab}
			<button
				class="rounded-lg px-5 py-1.5 text-sm font-medium transition-colors
					{activeTab === tab ? 'bg-base-elevated text-white' : 'text-text-secondary hover:text-white'}"
				onclick={() => (activeTab = tab)}
			>
				{tab === 'artists' ? 'Artists' : 'Users'}
			</button>
		{/each}
	</div>

	{#if activeTab === 'artists'}
		<!-- Genre filters -->
		<div class="mb-6 flex flex-wrap gap-2">
			<button
				class="rounded-full px-3 py-1 text-xs font-medium transition-colors
					{activeGenre === null
					? 'bg-accent text-white'
					: 'bg-base-surface text-text-secondary hover:text-white'}"
				onclick={() => (activeGenre = null)}
			>
				All
			</button>
			{#each allGenres as genre}
				<button
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors
						{activeGenre === genre
						? 'bg-accent text-white'
						: 'bg-base-surface text-text-secondary hover:text-white'}"
					onclick={() => (activeGenre = activeGenre === genre ? null : genre)}
				>
					{genre}
				</button>
			{/each}
		</div>

		<!-- Results grid -->
		{#if filteredArtists.length > 0}
			<div class="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{#each filteredArtists as artist}
					<ArtistCard {artist} size="md" />
				{/each}
			</div>
		{:else}
			<p class="mt-16 text-center text-text-secondary">No artists match "{query}"</p>
		{/if}
	{:else}
		<!-- Users list -->
		{#if filteredUsers.length > 0}
			<div class="flex flex-col gap-2 max-w-2xl">
				{#each filteredUsers as user}
					<a
						href="/user/{user.id}"
						class="flex items-center gap-4 rounded-xl bg-base-card p-4 transition-colors hover:bg-base-surface"
					>
						<UserAvatar {user} size="md" />
						<div class="min-w-0 flex-1">
							<p class="font-medium text-white">{user.displayName}</p>
							<p class="text-sm text-text-secondary">sha1: {user.sha1}…</p>
						</div>
						<!-- Top 3 artists inline -->
						<div class="hidden items-center gap-2 sm:flex">
							{#each user.topArtists.slice(0, 3) as ta}
								<div
									class="h-8 w-8 rounded-lg bg-gradient-to-br {ta.artist.gradient} flex items-center justify-center text-xs font-bold text-white/80"
									title={ta.artist.name}
								>
									{ta.artist.name[0]}
								</div>
							{/each}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<p class="mt-16 text-center text-text-secondary">No users match "{query}"</p>
		{/if}
	{/if}
</div>
