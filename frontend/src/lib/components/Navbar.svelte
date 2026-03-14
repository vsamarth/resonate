<script lang="ts">
	import { page } from '$app/stores';
	import { activeUser } from '$lib/stores';
	import type { User, ListUser } from '$lib/types';
	import UserAvatar from './UserAvatar.svelte';
	import { Home, Search, Music2, ChevronDown, Check } from 'lucide-svelte';

	interface Props {
		users: ListUser[];
	}

	let { users }: Props = $props();

	let userMenuOpen = $state(false);
	let scrolled = $state(false);

	function onScroll() {
		scrolled = window.scrollY > 8;
	}

	const navItems = [
		{ href: '/', label: 'For You', icon: Home },
		{ href: '/search', label: 'Search', icon: Search },
	];

	function isActive(href: string) {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}

	function handleOutsideClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-user-menu]')) {
			userMenuOpen = false;
		}
	}

	async function selectUser(user: ListUser) {
		const res = await fetch(`/api/users/${user.userIdx}`);
		if (!res.ok) return;
		const fullUser: User = await res.json();
		activeUser.set(fullUser);
		userMenuOpen = false;
	}

	// ListUser has displayName, sha1; UserAvatar only needs those (+ topArtists for type)
	const toUserLike = (u: ListUser): User => ({ ...u, topArtists: [] });
</script>

<svelte:window onclick={handleOutsideClick} onscroll={onScroll} />

<header
	class="fixed left-0 right-0 top-0 z-40 border-b transition-all duration-300
		{scrolled ? 'glass border-white/5' : 'border-transparent bg-transparent backdrop-blur-none'}"
>
	<div class="mx-auto flex h-14 max-w-screen-2xl items-center gap-6 px-4">
		<!-- Wordmark -->
		<a href="/" class="flex shrink-0 items-center gap-2 mr-2">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
				<Music2 class="h-3.5 w-3.5 text-white" />
			</div>
			<span class="text-sm font-semibold tracking-tight text-white">LightGCN</span>
		</a>

		<!-- Nav links -->
		<nav class="flex items-center gap-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
						{isActive(item.href)
						? 'bg-white/10 text-white'
						: 'text-text-secondary hover:bg-white/5 hover:text-white'}"
				>
					<item.icon class="h-3.5 w-3.5 shrink-0" />
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- User switcher -->
		<div class="relative" data-user-menu>
			<button
				class="flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-colors hover:bg-white/5"
				onclick={(e) => { e.stopPropagation(); userMenuOpen = !userMenuOpen; }}
			>
				<span class="hidden text-xs text-text-secondary sm:block">Listening as</span>
				{#if $activeUser}
					<UserAvatar user={$activeUser} size="sm" />
					<div class="hidden min-w-0 text-left sm:block">
						<p class="text-sm font-medium leading-tight text-white">{$activeUser.displayName}</p>
					</div>
				{:else}
					<div class="h-8 w-8 rounded-full bg-white/10 shrink-0" />
					<div class="hidden sm:block">
						<p class="text-sm text-text-secondary">Loading…</p>
					</div>
				{/if}
				<ChevronDown
					class="h-3.5 w-3.5 shrink-0 text-text-secondary transition-transform {userMenuOpen ? 'rotate-180' : ''}"
				/>
			</button>

			{#if userMenuOpen}
				<div
					class="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-base-surface shadow-2xl"
				>
					<div class="border-b border-white/5 px-3 py-2">
						<p class="text-xs font-medium uppercase tracking-wider text-text-tertiary">Switch user</p>
					</div>
					<div class="p-1 max-h-72 overflow-y-auto">
						{#each users as user}
							<button
								class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/5"
								onclick={() => selectUser(user)}
							>
								<UserAvatar user={toUserLike(user)} size="sm" />
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium text-white">{user.displayName}</p>
									<p class="truncate text-xs text-text-secondary">sha1: {user.sha1}…</p>
								</div>
								{#if $activeUser?.id === user.id}
									<Check class="h-3.5 w-3.5 shrink-0 text-accent" />
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>
