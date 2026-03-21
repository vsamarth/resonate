import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { artists } from '$lib/db/schema';
import { getUserLikes, addArtistLike } from '$lib/server/likes';
import { requireMatchingResonateUser } from '$lib/server/require-resonate-user';
import type { RequestHandler } from './$types';

function parseUserIdx(p: string): number {
	const n = parseInt(p, 10);
	if (isNaN(n) || n < 0) throw error(422, 'Invalid user_idx');
	return n;
}

export const GET: RequestHandler = async (event) => {
	const userIdx = parseUserIdx(event.params.userIdx);
	await requireMatchingResonateUser(event, userIdx);
	const items = await getUserLikes(userIdx);
	return json({ user_idx: userIdx, items });
};

export const POST: RequestHandler = async (event) => {
	const userIdx = parseUserIdx(event.params.userIdx);
	await requireMatchingResonateUser(event, userIdx);

	let body: { item_idx?: unknown };
	try {
		body = await event.request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}
	const itemIdx = body.item_idx;
	if (typeof itemIdx !== 'number' || !Number.isInteger(itemIdx) || itemIdx < 0) {
		throw error(422, 'item_idx must be a non-negative integer');
	}

	const [row] = await db
		.select({ itemIdx: artists.itemIdx })
		.from(artists)
		.where(eq(artists.itemIdx, itemIdx))
		.limit(1);
	if (!row) throw error(404, 'Artist not in dataset');

	await addArtistLike(userIdx, itemIdx);
	return json({ ok: true, user_idx: userIdx, item_idx: itemIdx });
};
