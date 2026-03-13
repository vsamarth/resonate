import { error } from '@sveltejs/kit';
import { getUserWithTopArtists } from '$lib/server/users';
import { getRecommendations } from '$lib/server/recommendations';
import { toArtist } from '$lib/api/recommendations';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const userIdx = parseInt(params.id, 10);
	if (isNaN(userIdx) || userIdx < 0) throw error(404, 'User not found');

	const user = await getUserWithTopArtists(userIdx);
	if (!user) throw error(404, 'User not found');

	const recRows = await getRecommendations(user.userIdx, 10);
	const recommendations = recRows.map((r) => ({
		artist: toArtist(r),
		score: r.score
	}));

	return { user, recommendations };
};
