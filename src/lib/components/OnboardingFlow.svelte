<script lang="ts">
	import { formatArtistName } from '$lib/format-artist-name';
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { activeUser, bumpLikesRevision, toastStore } from '$lib/stores';
	import type { Artist, User } from '$lib/types';
	import ArtistImage from './ArtistImage.svelte';
	import { Check, Music2, Plus } from 'lucide-svelte';

	interface Props {
		/** From layout: need 3–5 catalog picks */
		onboardingRequired: boolean;
		tasteArtists: Artist[];
		defaultUser: User | null;
	}

	let { onboardingRequired, tasteArtists, defaultUser: defaultUserProp }: Props = $props();

	const viewer = $derived($activeUser ?? defaultUserProp);
	const show = $derived(browser && onboardingRequired && viewer != null);

	const MIN_PICKS = 3;
	const MAX_PICKS = 5;

	let busy = $state(false);
	let selectedMbids = $state<string[]>([]);

	function toggleTaste(mbid: string) {
		if (selectedMbids.includes(mbid)) {
			selectedMbids = selectedMbids.filter((m) => m !== mbid);
			return;
		}
		if (selectedMbids.length >= MAX_PICKS) return;
		selectedMbids = [...selectedMbids, mbid];
	}

	function isSelected(mbid: string) {
		return selectedMbids.includes(mbid);
	}

	function selectionOrder(mbid: string): number {
		return selectedMbids.indexOf(mbid) + 1;
	}

	const atMaxPicks = $derived(selectedMbids.length >= MAX_PICKS);

	const canContinue = $derived(
		selectedMbids.length >= MIN_PICKS && selectedMbids.length <= MAX_PICKS
	);

	async function complete() {
		if (!canContinue || busy) return;
		busy = true;
		try {
			const res = await fetch('/api/me/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ mbids: selectedMbids })
			});
			if (!res.ok) {
				let msg = 'Could not save your picks';
				try {
					const j = (await res.json()) as { message?: string };
					if (typeof j.message === 'string' && j.message) msg = j.message;
				} catch {
					/* use default */
				}
				toastStore.show(msg);
				return;
			}
			selectedMbids = [];
			await invalidateAll();
			bumpLikesRevision();
		} catch {
			toastStore.show('Something went wrong');
		} finally {
			busy = false;
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a] text-white"
		role="dialog"
		aria-modal="true"
		aria-labelledby="onboard-title"
	>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.12),_transparent_55%)]"
		></div>

		<div class="relative flex flex-1 flex-col overflow-y-auto px-6 pb-10 pt-16 sm:px-10 sm:pt-20">
			<div class="mx-auto w-full max-w-5xl">
				<div class="mb-2 flex items-center justify-center gap-2 text-accent">
					<Music2 class="h-8 w-8" />
				</div>

				<h1 id="onboard-title" class="mb-2 text-center text-3xl font-semibold sm:text-4xl md:text-5xl">
					Pick a few artists you like
				</h1>
				<p class="mx-auto mb-4 max-w-lg text-center text-base text-zinc-400">
					Choose between {MIN_PICKS} and {MAX_PICKS} artists. We’ll use them to build your
					<span class="text-zinc-200">Made For You</span> recommendations.
				</p>
				<p class="mb-2 text-center text-sm font-medium tabular-nums text-zinc-300">
					<span class="text-white">{selectedMbids.length}</span>
					<span class="text-zinc-500"> / {MIN_PICKS}–{MAX_PICKS} selected</span>
				</p>
				{#if atMaxPicks}
					<p class="mb-10 text-center text-xs text-zinc-500">Tap a selected card to remove it</p>
				{:else}
					<p class="mb-10 text-center text-xs text-zinc-500">Tap cards to add — hover for a closer look</p>
				{/if}

				<div
					class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:max-w-6xl lg:mx-auto"
				>
					{#each tasteArtists as artist}
						{@const sel = isSelected(artist.mbid)}
						{@const dimmed = atMaxPicks && !sel}
						<button
							type="button"
							aria-pressed={sel}
							aria-label={sel
								? `Remove ${formatArtistName(artist.name)} from your picks`
								: atMaxPicks
									? `${formatArtistName(artist.name)} — maximum ${MAX_PICKS} artists selected`
									: `Add ${formatArtistName(artist.name)}`}
							onclick={() => toggleTaste(artist.mbid)}
							class="group relative w-full cursor-pointer rounded-2xl border-0 bg-transparent p-0 text-left
								focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]
								{dimmed ? 'opacity-[0.38] saturate-[0.65]' : 'opacity-100'}"
						>
							<div
								class="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.08] transition-all duration-300 ease-out
									active:scale-[0.98] motion-reduce:transition-none
									group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] group-hover:ring-white/[0.18]
									motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)]
									{sel
									? 'ring-2 ring-accent shadow-[0_0_0_1px_rgba(252,60,68,0.35),0_16px_48px_-12px_rgba(252,60,68,0.2)]'
									: ''}"
							>
								<div
									class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1/3 rounded-t-2xl bg-gradient-to-b from-white/[0.07] to-transparent"
									aria-hidden="true"
								></div>
								<div
									class="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
								>
									<ArtistImage
										artistName={artist.name}
										mbid={artist.mbid}
										gradient={artist.gradient}
										heightClass="h-full w-full min-h-[11rem] sm:min-h-[12.5rem]"
										rounded="rounded-2xl"
									/>
								</div>

								<!-- Bottom read zone -->
								<div
									class="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] rounded-b-2xl bg-gradient-to-t from-black via-black/75 to-transparent"
								></div>

								{#if sel}
									<div
										class="pointer-events-none absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-lg ring-2 ring-black/30"
										aria-hidden="true"
									>
										<Check class="h-5 w-5" strokeWidth={2.8} />
									</div>
									<div
										class="pointer-events-none absolute left-2.5 top-2.5 flex h-8 min-w-8 items-center justify-center rounded-full bg-black/55 px-2.5 text-xs font-bold tabular-nums text-white ring-1 ring-white/20 backdrop-blur-sm"
										aria-hidden="true"
									>
										{selectionOrder(artist.mbid)}
									</div>
								{:else if !atMaxPicks}
									<div
										class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/35 group-hover:opacity-100"
										aria-hidden="true"
									>
										<div
											class="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md"
										>
											<Plus class="h-7 w-7" strokeWidth={2} />
										</div>
									</div>
								{/if}

								<div class="pointer-events-none absolute inset-x-0 bottom-0 p-3 pt-8 sm:p-3.5 sm:pt-10">
									<p
										class="line-clamp-2 text-[0.8125rem] font-semibold leading-snug tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-sm"
									>
										{formatArtistName(artist.name)}
									</p>
									{#if artist.genre}
										<p class="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wider text-white/55">
											{artist.genre}
										</p>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>

				<div class="mx-auto mt-12 flex justify-center pb-2">
					<button
						type="button"
						disabled={!canContinue || busy}
						onclick={complete}
						class="rounded-xl bg-accent px-12 py-3.5 text-sm font-semibold text-white shadow-[0_8px_28px_-6px_rgba(252,60,68,0.55)] transition-all
							enabled:hover:translate-y-[-1px] enabled:hover:shadow-[0_12px_32px_-6px_rgba(252,60,68,0.6)]
							disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
					>
						{busy ? 'Saving…' : 'Continue'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
