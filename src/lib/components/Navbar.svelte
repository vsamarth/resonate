<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { activeUser, toastStore } from '$lib/stores';
	import type { User, ListUser } from '$lib/types';
	import UserAvatar from './UserAvatar.svelte';
	import { authClient } from '$lib/auth-client';
	import { impersonateAsUser } from '$lib/client/impersonate';
	import { Home, Search, Music2, ChevronDown, Check, LogOut } from 'lucide-svelte';

	interface Props {
		users: ListUser[];
		/** From root layout: DB down, empty DB, or ok */
		userDataStatus?: 'ok' | 'no_users' | 'database_unavailable';
		signedIn?: boolean;
	}

	let { users, userDataStatus = 'ok', signedIn = false }: Props = $props();

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
		try {
			await impersonateAsUser(user.userIdx, user.displayName);
			userMenuOpen = false;
		} catch {
			toastStore.show('Could not switch user');
		}
	}

	async function signOut() {
		userMenuOpen = false;
		await authClient.signOut();
		activeUser.set(null);
		await invalidateAll();
		goto('/sign-in');
	}

	// ListUser has displayName, sha1 (for avatar hue); UserAvatar only needs those (+ topArtists for type)
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
			<span class="text-sm font-semibold tracking-tight text-white">Resonate</span>
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
			{#if !signedIn}
				<a
					href="/sign-in"
					class="rounded-xl px-3 py-1.5 text-sm font-medium text-accent hover:bg-white/5"
				>
					Sign in
				</a>
			{:else}
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
				{:else if userDataStatus === 'database_unavailable'}
					<div class="h-8 w-8 rounded-full bg-red-500/20 shrink-0"></div>
					<div class="hidden sm:block">
						<p class="text-sm text-amber-200/90">Database offline</p>
					</div>
				{:else if userDataStatus === 'no_users'}
					<div class="h-8 w-8 rounded-full bg-white/10 shrink-0"></div>
					<div class="hidden sm:block">
						<p class="text-sm text-text-secondary">No users in DB</p>
					</div>
				{:else}
					<div class="h-8 w-8 rounded-full bg-white/10 shrink-0"></div>
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
								</div>
								{#if $activeUser?.id === user.id}
									<Check class="h-3.5 w-3.5 shrink-0 text-accent" />
								{/if}
							</button>
						{/each}
					</div>
					<div class="border-t border-white/5 p-1">
						<button
							type="button"
							class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-white"
							onclick={() => signOut()}
						>
							<LogOut class="h-3.5 w-3.5 shrink-0" />
							Sign out
						</button>
					</div>
				</div>
			{/if}
			{/if}
		</div>
	</div>
</header>
