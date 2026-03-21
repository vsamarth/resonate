<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { activeUser } from '$lib/stores';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		data: {
			users: import('$lib/types').ListUser[];
			defaultUser: import('$lib/types').User | null;
			userDataStatus: import('./+layout.server').UserDataStatus;
			signedIn: boolean;
		};
	}

	let { children, data }: Props = $props();

	// Hydrate active user from server default once (signed-in sessions only)
	$effect(() => {
		if (data.signedIn && $activeUser === null && data.defaultUser) {
			activeUser.set(data.defaultUser);
		}
	});
</script>

<div class="min-h-screen bg-base">
	<Navbar users={data.users} userDataStatus={data.userDataStatus} signedIn={data.signedIn} />
	<main class="pt-14">
		{@render children()}
	</main>
	<Toast />
</div>
