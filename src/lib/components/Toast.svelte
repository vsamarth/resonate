<script lang="ts">
	import { toastMessages, toastStore } from '$lib/stores';
	import { Check } from 'lucide-svelte';

	function dismiss(id: number) {
		toastStore.dismiss(id);
	}
</script>

<div
	class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
	aria-live="polite"
	role="region"
	aria-label="Notifications"
>
	{#each $toastMessages as t}
		<button
			type="button"
			onclick={() => dismiss(t.id)}
			class="flex items-center gap-2.5 rounded-xl border border-white/10 bg-base-elevated px-4 py-2.5 text-sm text-white shadow-lg
				ring-1 ring-white/5 transition hover:bg-base-surface focus:outline-none focus:ring-2 focus:ring-accent"
		>
			<Check class="h-4 w-4 shrink-0 text-accent" />
			{t.message}
		</button>
	{/each}
</div>
