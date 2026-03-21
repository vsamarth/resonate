import { isPlaceholderArtistImageUrl } from '$lib/artist-image-url';
import { env } from '$env/dynamic/private';

type LfmImage = { size: string; '#text': string };

function pickLastfmImageUrl(images: unknown): string | null {
	if (!Array.isArray(images)) return null;
	const rows = images as LfmImage[];
	const order = ['extralarge', 'mega', 'large', 'medium', 'small'];
	for (const size of order) {
		const row = rows.find(
			(i) =>
				i?.size === size &&
				typeof i['#text'] === 'string' &&
				i['#text'].trim().length > 0 &&
				!isPlaceholderArtistImageUrl(i['#text'])
		);
		if (row) return row['#text'].trim();
	}
	const any = rows.find(
		(i) =>
			typeof i?.['#text'] === 'string' &&
			i['#text'].trim().length > 0 &&
			!isPlaceholderArtistImageUrl(i['#text'])
	);
	return any?.['#text']?.trim() ?? null;
}

/** Server-only: Last.fm artist art by MusicBrainz id. */
export async function fetchLastfmArtistImage(mbid: string): Promise<string | null> {
	const key = env.LASTFM_API_KEY;
	if (!key?.trim() || !mbid?.trim()) return null;

	const api = new URL('https://ws.audioscrobbler.com/2.0/');
	api.searchParams.set('method', 'artist.getinfo');
	api.searchParams.set('mbid', mbid);
	api.searchParams.set('api_key', key);
	api.searchParams.set('format', 'json');

	try {
		const res = await fetch(api);
		if (!res.ok) return null;
		const data = (await res.json()) as { artist?: { image?: unknown } };
		return pickLastfmImageUrl(data?.artist?.image);
	} catch {
		return null;
	}
}
