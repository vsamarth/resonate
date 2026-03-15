import { json, error } from '@sveltejs/kit';
import { getRecommendations } from '$lib/server/recommendations';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const userIdx = parseInt(params.userIdx, 10);
	if (isNaN(userIdx) || userIdx < 0) throw error(422, 'Invalid user_idx');

	const k = Math.min(parseInt(url.searchParams.get('k') ?? '10', 10), 50);

	const items = await getRecommendations(userIdx, k);
	if (!items.length && userIdx > 2028) throw error(404, `user_idx ${userIdx} out of range`);

	return json({ user_idx: userIdx, k, items });
};
