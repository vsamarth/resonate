<script lang="ts">
	import { page } from '$app/stores';
	import { activeUser } from '$lib/stores';
	import type { User, ListUser } from '$lib/types';
	import UserAvatar from './UserAvatar.svelte';
	import { Home, Search, Music2, ChevronDown } from 'lucide-svelte';

	interface Props {
		users: ListUser[];
	}

	let { users }: Props = $props();

	let userMenuOpen = $state(false);

	const navItems = [
		{ href: '/', label: 'For You', icon: Home },
		{ href: '/search', label: 'Search', icon: Search },
	];

	function isActive(href: string) {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}

	async function selectUser(user: ListUser) {
		const res = await fetch(`/api/users/${user.userIdx}`);
		if (!res.ok) return;
		const fullUser: User = await res.json();
		activeUser.set(fullUser);
		userMenuOpen = false;
	}

	const toUserLike = (u: ListUser): User => ({ ...u, topArtists: [] });
</script>

<aside
	class="glass fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-white/5 px-3 py-5"
>
	<!-- Wordmark -->
	<div class="mb-8 flex items-center gap-2 px-2">
		<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
			<Music2 class="h-4 w-4 text-white" />
		</div>
		<span class="text-base font-semibold text-white">Resonate</span>
	</div>

	<!-- Navigation -->
	<nav class="flex flex-col gap-0.5">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
					{isActive(item.href)
					? 'bg-white/10 text-white'
					: 'text-text-secondary hover:bg-white/5 hover:text-white'}"
			>
				<item.icon class="h-4 w-4 shrink-0" />
				{item.label}
			</a>
		{/each}
	</nav>

	<!-- Spacer -->
	<div class="flex-1"></div>

	<!-- Active User Switcher -->
	<div class="border-t border-white/10 pt-4">
		<p class="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
			Listening as
		</p>

		<button
			class="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
			onclick={() => (userMenuOpen = !userMenuOpen)}
		>
			{#if $activeUser}
				<UserAvatar user={$activeUser} size="sm" />
				<div class="min-w-0 flex-1 text-left">
					<p class="truncate text-sm font-medium text-white">{$activeUser.displayName}</p>
					<p class="text-xs text-text-secondary">sha1: {$activeUser.sha1}…</p>
				</div>
			{:else}
				<div class="h-8 w-8 rounded-full bg-white/10 shrink-0" />
				<p class="text-sm text-text-secondary">Loading…</p>
			{/if}
			<ChevronDown
				class="h-4 w-4 shrink-0 text-text-secondary transition-transform {userMenuOpen ? 'rotate-180' : ''}"
			/>
		</button>

		{#if userMenuOpen}
			<div class="mt-1 flex flex-col gap-0.5 rounded-xl bg-base-surface p-1 max-h-48 overflow-y-auto">
				{#each users as user}
					<button
						class="flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5
							{$activeUser?.id === user.id ? 'bg-white/10' : ''}"
						onclick={() => selectUser(user)}
					>
						<UserAvatar user={toUserLike(user)} size="sm" />
						<div class="min-w-0">
							<p class="text-sm text-white">{user.displayName}</p>
							<p class="text-xs text-text-secondary">sha1: {user.sha1}…</p>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</aside>
