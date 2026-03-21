import type { Artist, Recommendation } from '$lib/types';
import { artists as staticArtists } from '$lib/data/artists';

// Same-origin API routes (SvelteKit server).
const BASE = '/api';

// Gradient palette — cycled for artists not in the static catalog
const GRADIENTS = [
	'from-red-700 to-orange-600',
	'from-slate-700 to-slate-500',
	'from-yellow-700 to-amber-500',
	'from-green-700 to-emerald-500',
	'from-pink-700 to-rose-500',
	'from-purple-700 to-violet-500',
	'from-teal-700 to-cyan-500',
	'from-blue-700 to-indigo-500',
	'from-orange-700 to-yellow-500',
	'from-lime-700 to-green-500',
	'from-sky-700 to-blue-400',
	'from-zinc-700 to-zinc-500',
	'from-red-900 to-red-600',
	'from-cyan-700 to-blue-500',
	'from-neutral-700 to-slate-600',
	'from-amber-600 to-yellow-400',
];

export interface ApiRec {
	item_idx: number;
	mbid: string;
	name: string;
	score: number;
}

/** Capitalize the first letter of each word, preserving non-ASCII (e.g. "die Ärzte" → "Die Ärzte") */
export function titleCase(str: string): string {
	return str.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/** Pick a gradient deterministically from an mbid string */
export function gradientFromMbid(mbid: string): string {
	let hash = 0;
	for (let i = 0; i < mbid.length; i++) {
		hash = (hash * 31 + mbid.charCodeAt(i)) >>> 0;
	}
	return GRADIENTS[hash % GRADIENTS.length];
}

/** Enrich an API recommendation with a full Artist object. Falls back to a minimal
 *  stub for artists not present in the static catalog. */
export function toArtist(rec: ApiRec): Artist {
	const found = staticArtists.find((a) => a.mbid === rec.mbid);
	if (found) return found;

	return {
		mbid: rec.mbid,
		name: titleCase(rec.name),
		genre: '',
		country: '',
		totalPlays: 0,
		listenerCount: 0,
		gradient: gradientFromMbid(rec.mbid),
		similarMbids: [],
	};
}

/** Fetch top-k recommendations for a model user index from the API.
 *  Returns an empty array on any error (server error, out-of-range, etc.). */
export async function fetchRecommendations(userIdx: number, k = 10): Promise<Recommendation[]> {
	try {
		const res = await fetch(`${BASE}/recommendations/${userIdx}?k=${k}`, { cache: 'no-store' });
		if (!res.ok) return [];
		const data: { items: ApiRec[] } = await res.json();
		return data.items.map((r) => ({
			artist: toArtist(r),
			score: r.score,
		}));
	} catch {
		return [];
	}
}

/** Session cookie — email-only accounts with `auth_artist_likes` cold start */
export async function fetchRecommendationsForMe(k = 10): Promise<Recommendation[]> {
	try {
		const res = await fetch(`${BASE}/recommendations/me?k=${k}`, {
			credentials: 'include',
			cache: 'no-store'
		});
		if (!res.ok) return [];
		const data: { items: ApiRec[] } = await res.json();
		return data.items.map((r) => ({
			artist: toArtist(r),
			score: r.score,
		}));
	} catch {
		return [];
	}
}

export interface ApiArtistInfo {
	item_idx: number;
	mbid: string;
	name: string;
}

/** Look up an artist in the model dataset by MBID.
 *  Returns null if the MBID isn't in the dataset or the API is unavailable. */
export async function fetchArtistByMbid(mbid: string): Promise<ApiArtistInfo | null> {
	try {
		const res = await fetch(`${BASE}/artists/by-mbid/${encodeURIComponent(mbid)}`);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

/** Fetch k artists most similar to the given item_idx by cosine similarity.
 *  Returns an empty array on any error. */
export async function fetchSimilarArtists(itemIdx: number, k = 6): Promise<Artist[]> {
	try {
		const res = await fetch(`${BASE}/similar-artists/${itemIdx}?k=${k}`);
		if (!res.ok) return [];
		const data: { similar: ApiRec[] } = await res.json();
		return data.similar.map(toArtist);
	} catch {
		return [];
	}
}
