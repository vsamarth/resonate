<script lang="ts">
	import type { User } from '$lib/types';

	interface Props {
		user: User;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		/** Show the play-count ring (used on profile page) */
		ringPct?: number;
	}

	let { user, size = 'md', ringPct }: Props = $props();

	let imgErrored = $state(false);

	$effect(() => {
		user.avatarUrl;
		user.id;
		imgErrored = false;
	});

	const showPhoto = $derived(
		Boolean(user.avatarUrl?.trim()) && !imgErrored
	);

	// Generate a consistent hue from SHA1
	function hueFromSha(sha: string): number {
		let hash = 0;
		for (let i = 0; i < sha.length; i++) {
			hash = (hash * 31 + sha.charCodeAt(i)) & 0xffffffff;
		}
		return Math.abs(hash) % 360;
	}

	const hue = $derived(hueFromSha(user.sha1));
	const initials = $derived(user.displayName.slice(0, 2).toUpperCase());

	const pxMap = { sm: 32, md: 40, lg: 56, xl: 80 };
	const textMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-2xl' };
	const px = $derived(pxMap[size]);
	const strokeW = 3;
	const r = $derived((px - strokeW) / 2);
	const circ = $derived(2 * Math.PI * r);
	const dashOffset = $derived(ringPct !== undefined ? circ * (1 - ringPct / 100) : circ);
</script>

<div class="relative inline-flex items-center justify-center" style="width:{px}px;height:{px}px">
	{#if ringPct !== undefined}
		<!-- SVG ring -->
		<svg
			class="absolute inset-0"
			width={px}
			height={px}
			viewBox="0 0 {px} {px}"
			style="transform: rotate(-90deg)"
		>
			<circle
				cx={px / 2}
				cy={px / 2}
				r={r}
				fill="none"
				stroke="rgba(255,255,255,0.1)"
				stroke-width={strokeW}
			/>
			<circle
				cx={px / 2}
				cy={px / 2}
				r={r}
				fill="none"
				stroke="#FC3C44"
				stroke-width={strokeW}
				stroke-dasharray={circ}
				stroke-dashoffset={dashOffset}
				stroke-linecap="round"
			/>
		</svg>
	{/if}

	<!-- Avatar: photo when we have a URL, else initials -->
	{#if showPhoto}
		<img
			src={user.avatarUrl}
			alt=""
			class="rounded-full object-cover {ringPct !== undefined ? 'ring-2 ring-base' : ''}"
			style="width: {px - (ringPct !== undefined ? strokeW * 2 + 4 : 0)}px; height: {px - (ringPct !== undefined ? strokeW * 2 + 4 : 0)}px;"
			referrerpolicy="no-referrer"
			onerror={() => (imgErrored = true)}
		/>
	{:else}
		<div
			class="flex items-center justify-center rounded-full font-semibold text-white {textMap[size]}"
			style="
				width: {px - (ringPct !== undefined ? strokeW * 2 + 4 : 0)}px;
				height: {px - (ringPct !== undefined ? strokeW * 2 + 4 : 0)}px;
				background: hsl({hue}, 60%, 35%);
			"
		>
			{initials}
		</div>
	{/if}
</div>
