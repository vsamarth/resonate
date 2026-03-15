<script lang="ts">
	import { onMount } from 'svelte';
	import { artists } from '$lib/data/artists';
	import ArtistCard from '$lib/components/ArtistCard.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { ListUser } from '$lib/types';
	import { Search, X } from 'lucide-svelte';

	interface Props {
		data: { users: ListUser[] };
	}

	let { data }: Props = $props();

	let query = $state('');
	let activeTab = $state<'artists' | 'users'>('artists');
	let activeGenre = $state<string | null>(null);
	let searchInputEl = $state<HTMLInputElement | null>(null);

	onMount(() => {
		function onKeydown(e: KeyboardEvent) {
			if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
			const target = e.target as HTMLElement;
			if (target?.closest('input, textarea, [contenteditable]')) return;
			e.preventDefault();
			searchInputEl?.focus();
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

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
		data.users.filter(
			(u) =>
				query.length === 0 ||
				u.displayName.toLowerCase().includes(query.toLowerCase()) ||
				u.sha1.includes(query.toLowerCase())
		)
	);

	// UserAvatar expects User; ListUser has displayName, sha1, id — use minimal shape
	const userForAvatar = (u: ListUser) => ({ ...u, topArtists: [] });
</script>

<div class="min-h-screen px-8 py-10">
	<!-- Search header -->
	<h1 class="mb-6 text-3xl font-bold text-white">Search</h1>

	<div class="relative mb-6 max-w-2xl">
		<Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary pointer-events-none" />
		<input
			bind:this={searchInputEl}
			type="text"
			placeholder="Artists, users… (press / to focus)"
			bind:value={query}
			class="w-full rounded-2xl bg-base-surface py-3.5 pl-12 pr-11 text-white placeholder:text-text-secondary
				outline-none ring-1 ring-white/10 transition focus:ring-accent"
		/>
		{#if query.length > 0}
			<button
				type="button"
				onclick={() => (query = '')}
				aria-label="Clear search"
				class="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition hover:bg-white/10 hover:text-white"
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
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
			<EmptyState
				title={query ? `No artists match "${query}"` : 'No artists yet'}
				description={query ? 'Try a different search or genre.' : 'Artists will show up here.'}
				class="mt-16"
			/>
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
						<UserAvatar user={userForAvatar(user)} size="md" />
						<div class="min-w-0 flex-1">
							<p class="font-medium text-white">{user.displayName}</p>
							<p class="text-sm text-text-secondary">sha1: {user.sha1}…</p>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<EmptyState
				title={query ? `No users match "${query}"` : 'No users yet'}
				description={query ? 'Try a different search.' : 'Users will show up here.'}
				class="mt-16"
			/>
		{/if}
	{/if}
</div>
