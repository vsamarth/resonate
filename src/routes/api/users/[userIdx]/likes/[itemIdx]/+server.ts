import { json, error } from '@sveltejs/kit';
import { removeArtistLike } from '$lib/server/likes';
import { requireMatchingResonateUser } from '$lib/server/require-resonate-user';
import type { RequestHandler } from './$types';

function parseUserIdx(p: string): number {
	const n = parseInt(p, 10);
	if (isNaN(n) || n < 0) throw error(422, 'Invalid user_idx');
	return n;
}

function parseItemIdx(p: string): number {
	const n = parseInt(p, 10);
	if (isNaN(n) || n < 0) throw error(422, 'Invalid item_idx');
	return n;
}

export const DELETE: RequestHandler = async (event) => {
	const userIdx = parseUserIdx(event.params.userIdx);
	const itemIdx = parseItemIdx(event.params.itemIdx);
	await requireMatchingResonateUser(event, userIdx);
	await removeArtistLike(userIdx, itemIdx);
	return json({ ok: true, user_idx: userIdx, item_idx: itemIdx });
};
