import { json, error } from '@sveltejs/kit';
import { getSimilarArtists } from '$lib/server/recommendations';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const itemIdx = parseInt(params.itemIdx, 10);
	if (isNaN(itemIdx) || itemIdx < 0) throw error(422, 'Invalid item_idx');

	const k = Math.min(parseInt(url.searchParams.get('k') ?? '6', 10), 20);

	const similar = await getSimilarArtists(itemIdx, k);
	if (!similar.length && itemIdx > 3853) throw error(404, `item_idx ${itemIdx} out of range`);

	return json({ item_idx: itemIdx, k, similar });
};
