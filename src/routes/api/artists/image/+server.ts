import { json, type RequestHandler } from '@sveltejs/kit';
import { fetchLastfmArtistImage } from '$lib/server/lastfm';

/** JSON `{ url: string | null }` for client-side artist cards (Last.fm, keyed by MBID). */
export const GET: RequestHandler = async ({ url }) => {
	const mbid = url.searchParams.get('mbid');
	if (!mbid) return json({ url: null });
	const imageUrl = await fetchLastfmArtistImage(mbid);
	return json({ url: imageUrl });
};
