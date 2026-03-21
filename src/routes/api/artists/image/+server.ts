import { json, type RequestHandler } from '@sveltejs/kit';
import { resolveArtistImageUrl } from '$lib/server/artist-image';

/** JSON `{ url }` — Last.fm by MBID, then Wikipedia by optional `name`. */
export const GET: RequestHandler = async ({ url }) => {
	const mbid = url.searchParams.get('mbid');
	if (!mbid) return json({ url: null });
	const name = url.searchParams.get('name');
	const imageUrl = await resolveArtistImageUrl(mbid, name);
	return json({ url: imageUrl });
};
