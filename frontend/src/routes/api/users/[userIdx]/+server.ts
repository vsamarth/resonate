import { json, error } from '@sveltejs/kit';
import { getUserWithTopArtists } from '$lib/server/users';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const userIdx = parseInt(params.userIdx, 10);
	if (isNaN(userIdx) || userIdx < 0) throw error(422, 'Invalid user_idx');

	const user = await getUserWithTopArtists(userIdx);
	if (!user) throw error(404, 'User not found');

	return json(user);
};
