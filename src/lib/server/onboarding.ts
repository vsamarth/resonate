import { count, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/db';
import { artists, authArtistLikes, userArtistLikes } from '$lib/db/schema';
import { getArtistByMbid } from '$lib/server/recommendations';

export async function countDatasetUserLikes(userIdx: number): Promise<number> {
	const [row] = await db
		.select({ c: count() })
		.from(userArtistLikes)
		.where(eq(userArtistLikes.userIdx, userIdx));
	return Number(row?.c ?? 0);
}

export async function countAuthUserLikes(userId: string): Promise<number> {
	const [row] = await db
		.select({ c: count() })
		.from(authArtistLikes)
		.where(eq(authArtistLikes.userId, userId));
	return Number(row?.c ?? 0);
}

const MIN_ONBOARD = 3;
const MAX_ONBOARD = 5;

/** Validate 3–5 unique item_idx that exist in `artists`. */
export function parseOnboardingItemIdxs(raw: unknown): number[] | null {
	if (!Array.isArray(raw)) return null;
	const nums = raw
		.map((x) => (typeof x === 'number' ? x : typeof x === 'string' ? parseInt(x, 10) : NaN))
		.filter((n) => Number.isInteger(n) && n >= 0);
	const unique = [...new Set(nums)];
	if (unique.length < MIN_ONBOARD || unique.length > MAX_ONBOARD) return null;
	return unique;
}

/** Validate 3–5 unique MBID strings (resolved to `item_idx` on the server against `artists`). */
export function parseOnboardingMbids(raw: unknown): string[] | null {
	if (!Array.isArray(raw)) return null;
	const mbids = [
		...new Set(
			raw
				.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
				.map((s) => s.trim())
		)
	];
	if (mbids.length < MIN_ONBOARD || mbids.length > MAX_ONBOARD) return null;
	return mbids;
}

/** Map onboarding MBIDs to unique `item_idx`; null if any MBID missing or unique count not in 3–5. */
export async function resolveOnboardingMbidsToItemIdxs(mbids: string[]): Promise<number[] | null> {
	const idxs: number[] = [];
	for (const mbid of mbids) {
		const row = await getArtistByMbid(mbid);
		if (!row) return null;
		idxs.push(row.item_idx);
	}
	const unique = [...new Set(idxs)];
	if (unique.length < MIN_ONBOARD || unique.length > MAX_ONBOARD) return null;
	return unique;
}

export async function assertArtistsExist(itemIdxs: number[]): Promise<boolean> {
	const rows = await db
		.select({ itemIdx: artists.itemIdx })
		.from(artists)
		.where(inArray(artists.itemIdx, itemIdxs));
	return rows.length === itemIdxs.length;
}

export async function saveDatasetOnboardingLikes(userIdx: number, itemIdxs: number[]): Promise<void> {
	for (const itemIdx of itemIdxs) {
		await db
			.insert(userArtistLikes)
			.values({ userIdx, itemIdx })
			.onConflictDoNothing();
	}
}

export async function saveAuthOnboardingLikes(userId: string, itemIdxs: number[]): Promise<void> {
	await db.delete(authArtistLikes).where(eq(authArtistLikes.userId, userId));
	if (itemIdxs.length === 0) return;
	await db.insert(authArtistLikes).values(itemIdxs.map((itemIdx) => ({ userId, itemIdx })));
}
