import { json, error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { getResonateUserIdx } from '$lib/server/session-user';
import { getRecommendationsForAuthUser } from '$lib/server/recommendations';
import type { RequestHandler } from './$types';

/** Session-based recs for email-only accounts (no dataset `user_idx`). */
export const GET: RequestHandler = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');

	if (getResonateUserIdx(session.user) != null) {
		throw error(400, 'Use /api/recommendations/[userIdx] for dataset profiles');
	}

	const k = Math.min(parseInt(event.url.searchParams.get('k') ?? '10', 10), 50);
	const items = await getRecommendationsForAuthUser(session.user.id, k);
	return json({ k, items });
};
