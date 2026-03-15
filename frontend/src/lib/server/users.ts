/**
 * Server-only: load users from the database.
 */
import { sql } from 'drizzle-orm';
import { db } from '$lib/db';
import { toArtist } from '$lib/api/recommendations';
import type { User, UserTopArtist, ListUser } from '$lib/types';

export type { ListUser };

interface UserRow {
	user_idx: number;
	sha1: string;
	display_name: string | null;
	avatar_url: string | null;
}

interface ArtistRow {
	item_idx: number;
	mbid: string;
	name: string;
}

/** Users that have a profile (display_name), for switcher and search. */
export async function getUsersWithProfiles(limit = 100): Promise<ListUser[]> {
	const rows = await db.execute<UserRow>(sql`
		SELECT user_idx, sha1, display_name, avatar_url
		FROM users
		WHERE display_name IS NOT NULL
		ORDER BY user_idx
		LIMIT ${limit}
	`);
	return rows.rows.map((r) => ({
		id: String(r.user_idx),
		userIdx: r.user_idx,
		sha1: r.sha1,
		displayName: r.display_name ?? `User #${r.user_idx}`,
		avatarUrl: r.avatar_url
	}));
}

/** Full user with top artists (from train_edges), ordered by play count. */
export async function getUserWithTopArtists(userIdx: number): Promise<User | null> {
	const userRows = await db.execute<UserRow>(sql`
		SELECT user_idx, sha1, display_name, avatar_url
		FROM users
		WHERE user_idx = ${userIdx}
		LIMIT 1
	`);
	const u = userRows.rows[0];
	if (!u) return null;

	const artistRows = await db.execute<ArtistRow & { plays: number }>(sql`
		SELECT a.item_idx, a.mbid, a.name, COALESCE(t.plays, 1) AS plays
		FROM train_edges t
		INNER JOIN artists a ON a.item_idx = t.item_idx
		WHERE t.user_idx = ${userIdx}
		ORDER BY COALESCE(t.plays, 1) DESC
		LIMIT 20
	`);

	const topArtists: UserTopArtist[] = artistRows.rows.map((r) => ({
		artist: toArtist({ item_idx: r.item_idx, mbid: r.mbid, name: r.name, score: 1 }),
		plays: r.plays
	}));

	return {
		id: String(u.user_idx),
		sha1: u.sha1,
		displayName: u.display_name ?? `User #${u.user_idx}`,
		userIdx: u.user_idx,
		topArtists
	};
}

/** Minimal User for display (e.g. top listeners list). */
function toMinimalUser(r: UserRow): User {
	return {
		id: String(r.user_idx),
		sha1: r.sha1,
		displayName: r.display_name ?? `User #${r.user_idx}`,
		userIdx: r.user_idx,
		topArtists: []
	};
}

/** Users who have this artist in their history (train_edges), ordered by play count. */
export async function getTopListenersForArtist(
	mbid: string,
	limit = 5
): Promise<Array<{ user: User; plays: number }>> {
	const itemRow = await db.execute<{ item_idx: number }>(sql`
		SELECT item_idx FROM artists WHERE mbid = ${mbid} LIMIT 1
	`);
	const itemIdx = itemRow.rows[0]?.item_idx;
	if (itemIdx == null) return [];

	const rows = await db.execute<UserRow & { plays: number }>(sql`
		SELECT u.user_idx, u.sha1, u.display_name, u.avatar_url, COALESCE(t.plays, 1) AS plays
		FROM train_edges t
		INNER JOIN users u ON u.user_idx = t.user_idx
		WHERE t.item_idx = ${itemIdx}
		ORDER BY COALESCE(t.plays, 1) DESC
		LIMIT ${limit}
	`);

	return rows.rows.map((r) => ({
		user: toMinimalUser(r),
		plays: r.plays
	}));
}
