<script lang="ts">
	import { Music2 } from 'lucide-svelte';

	interface Props {
		title: string;
		description?: string;
		icon?: 'music' | 'search';
		class?: string;
	}
	let { title, description, icon = 'music', class: className = '' }: Props = $props();
</script>

<div
	class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-base-card/50 py-12 px-6 text-center {className}"
	role="status"
>
	<div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
		<Music2 class="h-7 w-7 text-text-tertiary" />
	</div>
	<p class="text-sm font-medium text-white">{title}</p>
	{#if description}
		<p class="mt-1 max-w-xs text-xs text-text-secondary">{description}</p>
	{/if}
</div>
