import { json, error } from '@sveltejs/kit';
import { getArtistByMbid } from '$lib/server/recommendations';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const artist = await getArtistByMbid(params.mbid);
	if (!artist) throw error(404, `MBID ${params.mbid} not found`);
	return json(artist);
};
