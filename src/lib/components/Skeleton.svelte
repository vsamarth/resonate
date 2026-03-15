<script lang="ts">
	interface Props {
		/** 'avatar' | 'text' | 'card' | 'row' */
		variant?: 'avatar' | 'text' | 'card' | 'row';
		class?: string;
	}
	let { variant = 'text', class: className = '' }: Props = $props();
</script>

{#if variant === 'avatar'}
	<div
		class="animate-pulse rounded-full bg-white/10 {className}"
		aria-hidden="true"
	></div>
{:else if variant === 'text'}
	<div
		class="animate-pulse rounded-md bg-white/10 {className}"
		aria-hidden="true"
	></div>
{:else if variant === 'card'}
	<div class="flex flex-col {className}" aria-hidden="true">
		<div class="animate-pulse rounded-card bg-white/10 aspect-square w-full shrink-0"></div>
		<div class="mt-2 space-y-1.5 px-0.5">
			<div class="h-3.5 w-3/4 rounded-md bg-white/10"></div>
			<div class="h-3 w-1/2 rounded-md bg-white/10"></div>
		</div>
	</div>
{:else if variant === 'row'}
	<div class="scroll-row flex gap-4 overflow-hidden pb-2 {className}" aria-hidden="true">
		{#each Array(5) as _}
			<div class="flex shrink-0 flex-col">
				<div class="h-44 w-44 animate-pulse rounded-card bg-white/10"></div>
				<div class="mt-2 space-y-1.5 px-0.5">
					<div class="h-3.5 w-32 rounded-md bg-white/10"></div>
					<div class="h-3 w-20 rounded-md bg-white/10"></div>
				</div>
			</div>
		{/each}
	</div>
{/if}
