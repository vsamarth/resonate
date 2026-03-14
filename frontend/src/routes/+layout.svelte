<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { activeUser } from '$lib/stores';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		data: { users: import('$lib/types').ListUser[]; defaultUser: import('$lib/types').User | null };
	}

	let { children, data }: Props = $props();

	// Hydrate active user from server default once
	$effect(() => {
		if ($activeUser === null && data.defaultUser) {
			activeUser.set(data.defaultUser);
		}
	});
</script>

<div class="min-h-screen bg-base">
	<Navbar users={data.users} />
	<main class="pt-14">
		{@render children()}
	</main>
</div>
