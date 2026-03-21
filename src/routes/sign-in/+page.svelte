<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { Music2 } from 'lucide-svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let userIdx = $state('');
</script>

<svelte:head>
	<title>Sign in — Resonate</title>
</svelte:head>

<div class="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-12">
	<div class="mb-8 flex flex-col items-center gap-3 text-center">
		<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
			<Music2 class="h-6 w-6 text-white" />
		</div>
		<h1 class="text-2xl font-semibold tracking-tight text-white">Choose a profile</h1>
		<p class="text-sm text-text-secondary">
			Sign in by impersonating one of the dataset users that have a display name (up to 100).
		</p>
	</div>

	{#if data.userDataStatus === 'database_unavailable'}
		<p class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
			Database is unavailable. Check <code class="text-xs">DATABASE_URL</code> and try again.
		</p>
	{:else if data.userDataStatus === 'no_users' || data.users.length === 0}
		<p class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text-secondary">
			No users with profiles in the database yet.
		</p>
	{:else}
		<form
			method="POST"
			action="?/signIn"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
				};
			}}
			class="flex flex-col gap-4"
		>
			<div class="flex flex-col gap-2">
				<label for="userIdx" class="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Profile
				</label>
				<select
					id="userIdx"
					name="userIdx"
					bind:value={userIdx}
					required
					class="w-full rounded-xl border border-white/10 bg-base-surface px-3 py-2.5 text-sm text-white outline-none
						ring-accent/0 transition-shadow focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
				>
					<option value="" disabled>Select a user…</option>
					{#each data.users as u}
						<option value={String(u.userIdx)}>{u.displayName}</option>
					{/each}
				</select>
			</div>

			{#if form?.message}
				<p class="text-sm text-amber-200/90">{form.message}</p>
			{/if}

			<button
				type="submit"
				disabled={!userIdx}
				class="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity
					enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
			>
				Continue
			</button>
		</form>
	{/if}
</div>
