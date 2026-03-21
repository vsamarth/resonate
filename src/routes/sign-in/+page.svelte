<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { Music2 } from 'lucide-svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	type Tab = 'dataset' | 'signup' | 'signin';
	let tab = $state<Tab>('dataset');
	let userIdx = $state('');

	let signupName = $state('');
	let signupEmail = $state('');
	let signupPassword = $state('');
	let signupConfirm = $state('');

	let signinEmail = $state('');
	let signinPassword = $state('');

	$effect(() => {
		if (form?.mode) tab = form.mode;
		if (form?.mode === 'signup') {
			if (form.name != null) signupName = form.name;
			if (form.email != null) signupEmail = form.email;
		}
		if (form?.mode === 'signin' && form.email != null) signinEmail = form.email;
	});

	const title = $derived(
		tab === 'signup' ? 'Create account' : tab === 'signin' ? 'Sign in' : 'Choose a profile'
	);
	const subtitle = $derived(
		tab === 'signup'
			? 'Create your own login. Use the user menu anytime to switch to a dataset profile for full listening history.'
			: tab === 'signin'
				? 'Sign in with the email and password you used to register.'
				: 'Pick a seeded dataset user (up to 100 with display names).'
	);
</script>

<svelte:head>
	<title>Account — Resonate</title>
</svelte:head>

<div class="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-12">
	<div class="mb-8 flex flex-col items-center gap-3 text-center">
		<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
			<Music2 class="h-6 w-6 text-white" />
		</div>
		<h1 class="text-2xl font-semibold tracking-tight text-white">{title}</h1>
		<p class="text-sm text-text-secondary">{subtitle}</p>
	</div>

	<div
		class="mb-6 flex rounded-xl border border-white/10 bg-base-surface p-1 text-xs font-medium text-text-secondary"
		role="tablist"
		aria-label="Sign-in method"
	>
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'dataset'}
			class="flex-1 rounded-lg px-2 py-2 transition-colors sm:px-3 {tab === 'dataset'
				? 'bg-white/10 text-white'
				: 'hover:text-white'}"
			onclick={() => (tab = 'dataset')}
		>
			Demo
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'signup'}
			class="flex-1 rounded-lg px-2 py-2 transition-colors sm:px-3 {tab === 'signup'
				? 'bg-white/10 text-white'
				: 'hover:text-white'}"
			onclick={() => (tab = 'signup')}
		>
			New account
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'signin'}
			class="flex-1 rounded-lg px-2 py-2 transition-colors sm:px-3 {tab === 'signin'
				? 'bg-white/10 text-white'
				: 'hover:text-white'}"
			onclick={() => (tab = 'signin')}
		>
			Sign in
		</button>
	</div>

	{#if data.userDataStatus === 'database_unavailable'}
		<p class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
			Database is unavailable. Check <code class="text-xs">DATABASE_URL</code> and try again.
		</p>
	{:else if tab === 'signup'}
		<form
			method="POST"
			action="?/register"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
				};
			}}
			class="flex flex-col gap-4"
		>
			<div class="flex flex-col gap-2">
				<label for="su-name" class="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Name
				</label>
				<input
					id="su-name"
					name="name"
					type="text"
					autocomplete="name"
					required
					bind:value={signupName}
					class="w-full rounded-xl border border-white/10 bg-base-surface px-3 py-2.5 text-sm text-white outline-none
						ring-accent/0 transition-shadow focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
				/>
			</div>
			<div class="flex flex-col gap-2">
				<label for="su-email" class="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Email
				</label>
				<input
					id="su-email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={signupEmail}
					class="w-full rounded-xl border border-white/10 bg-base-surface px-3 py-2.5 text-sm text-white outline-none
						ring-accent/0 transition-shadow focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
				/>
			</div>
			<div class="flex flex-col gap-2">
				<label for="su-password" class="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Password
				</label>
				<input
					id="su-password"
					name="password"
					type="password"
					autocomplete="new-password"
					required
					minlength="8"
					bind:value={signupPassword}
					class="w-full rounded-xl border border-white/10 bg-base-surface px-3 py-2.5 text-sm text-white outline-none
						ring-accent/0 transition-shadow focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
				/>
				<p class="text-xs text-text-tertiary">At least 8 characters.</p>
			</div>
			<div class="flex flex-col gap-2">
				<label for="su-confirm" class="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Confirm password
				</label>
				<input
					id="su-confirm"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					required
					minlength="8"
					bind:value={signupConfirm}
					class="w-full rounded-xl border border-white/10 bg-base-surface px-3 py-2.5 text-sm text-white outline-none
						ring-accent/0 transition-shadow focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
				/>
			</div>

			{#if form?.mode === 'signup' && form?.message}
				<p class="text-sm text-amber-200/90">{form.message}</p>
			{/if}

			<button
				type="submit"
				class="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
			>
				Create account
			</button>
		</form>
	{:else if tab === 'signin'}
		<form
			method="POST"
			action="?/emailSignIn"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
				};
			}}
			class="flex flex-col gap-4"
		>
			<div class="flex flex-col gap-2">
				<label for="si-email" class="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Email
				</label>
				<input
					id="si-email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={signinEmail}
					class="w-full rounded-xl border border-white/10 bg-base-surface px-3 py-2.5 text-sm text-white outline-none
						ring-accent/0 transition-shadow focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
				/>
			</div>
			<div class="flex flex-col gap-2">
				<label for="si-password" class="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Password
				</label>
				<input
					id="si-password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					bind:value={signinPassword}
					class="w-full rounded-xl border border-white/10 bg-base-surface px-3 py-2.5 text-sm text-white outline-none
						ring-accent/0 transition-shadow focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
				/>
			</div>

			{#if form?.mode === 'signin' && form?.message}
				<p class="text-sm text-amber-200/90">{form.message}</p>
			{/if}

			<button
				type="submit"
				class="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
			>
				Sign in
			</button>
		</form>
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

			{#if form?.mode === 'dataset' && form?.message}
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
