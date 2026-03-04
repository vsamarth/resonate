<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="flex min-h-screen bg-base">
	<Sidebar />

	<!-- Main content shifted right by sidebar width -->
	<main class="ml-60 flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>
