import { json, error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { getResonateUserIdx } from '$lib/server/session-user';
import {
	assertArtistsExist,
	parseOnboardingItemIdxs,
	parseOnboardingMbids,
	resolveOnboardingMbidsToItemIdxs,
	saveAuthOnboardingLikes,
	saveDatasetOnboardingLikes
} from '$lib/server/onboarding';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');

	let body: { item_idx?: unknown; mbids?: unknown };
	try {
		body = await event.request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	let itemIdxs: number[] | null = null;
	const mbids = parseOnboardingMbids(body.mbids);
	if (mbids) {
		itemIdxs = await resolveOnboardingMbidsToItemIdxs(mbids);
		if (!itemIdxs) {
			throw error(
				422,
				'Every pick must exist in the dataset (3–5 distinct catalog artists). Your static list may not match the DB — try other artists or re-seed.'
			);
		}
	} else {
		itemIdxs = parseOnboardingItemIdxs(body.item_idx);
		if (!itemIdxs) {
			throw error(422, 'Provide 3–5 unique item_idx values, or mbids: string[]');
		}
	}

	const ok = await assertArtistsExist(itemIdxs);
	if (!ok) throw error(422, 'One or more artists are not in the dataset');

	const resonateIdx = getResonateUserIdx(session.user);
	try {
		if (resonateIdx != null) {
			await saveDatasetOnboardingLikes(resonateIdx, itemIdxs);
		} else {
			await saveAuthOnboardingLikes(session.user.id, itemIdxs);
		}
	} catch (e) {
		console.error('[onboarding] save failed', e);
		throw error(
			500,
			'Could not save picks. Run `bun run db:migrate` so `auth_artist_likes` / `user_artist_likes` exist.'
		);
	}

	return json({ ok: true });
};
