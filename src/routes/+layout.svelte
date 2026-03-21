<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import OnboardingFlow from '$lib/components/OnboardingFlow.svelte';
	import { gradientFromMbid } from '$lib/api/recommendations';
	import { artists as staticArtists } from '$lib/data/artists';
	import type { Artist } from '$lib/types';
	import { activeUser } from '$lib/stores';
	import { get } from 'svelte/store';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		data: {
			users: import('$lib/types').ListUser[];
			defaultUser: import('$lib/types').User | null;
			userDataStatus: import('./+layout.server').UserDataStatus;
			signedIn: boolean;
			onboardingRequired?: boolean;
			onboardingArtistPool?: { mbid: string; name: string }[];
		};
	}

	let { children, data }: Props = $props();

	function poolRowToArtist(p: { mbid: string; name: string }): Artist {
		return {
			mbid: p.mbid,
			name: p.name,
			genre: '',
			country: '',
			totalPlays: 0,
			listenerCount: 0,
			gradient: gradientFromMbid(p.mbid),
			similarMbids: []
		};
	}

	const tastePickArtists = $derived.by((): Artist[] => {
		const pool = data.onboardingArtistPool ?? [];
		if (pool.length >= 3) {
			return pool.map(poolRowToArtist);
		}
		return [...staticArtists].sort((a, b) => b.totalPlays - a.totalPlays).slice(0, 16);
	});

	// Hydrate before descendants paint; re-sync same user when layout reloads (e.g. after onboarding).
	$effect.pre(() => {
		if (!data.signedIn || !data.defaultUser) return;
		const next = data.defaultUser;
		const cur = get(activeUser);
		if (cur === null || cur.id === next.id) {
			activeUser.set(next);
		}
	});
</script>

<div class="min-h-screen bg-base">
	{#if data.signedIn && data.defaultUser && (data.onboardingRequired ?? false)}
		<OnboardingFlow
			onboardingRequired={true}
			tasteArtists={tastePickArtists}
			defaultUser={data.defaultUser}
		/>
	{/if}
	<Navbar users={data.users} userDataStatus={data.userDataStatus} signedIn={data.signedIn} />
	<main class="pt-14">
		{@render children()}
	</main>
	<Toast />
</div>
