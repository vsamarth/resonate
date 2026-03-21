/**
 * Server-only: load users from the database.
 */
import { sql } from 'drizzle-orm';
import { db } from '$lib/db';
import { toArtist } from '$lib/api/recommendations';
import type { User, UserTopArtist, ListUser } from '$lib/types';
import { getUserLikes, type LikedArtistRow } from '$lib/server/likes';

export type { ListUser };

interface UserRow {
	user_idx: number;
	sha1: string;
	display_name: string | null;
	avatar_url: string | null;
	[key: string]: unknown;
}

interface ArtistRow {
	item_idx: number;
	mbid: string;
	name: string;
	[key: string]: unknown;
}

/** Smallest `user_idx` in `users`, or null if the table is empty. */
export async function getFirstUserIdx(): Promise<number | null> {
	const rows = await db.execute<{ user_idx: number }>(sql`
		SELECT user_idx FROM users ORDER BY user_idx ASC LIMIT 1
	`);
	return rows.rows[0]?.user_idx ?? null;
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

const MAX_TOP_ARTISTS_ROW = 32;

/** Listening history first, then liked artists (most recent like first), deduped by mbid. */
export function mergeListeningAndLikedTopArtists(
	listening: UserTopArtist[],
	liked: LikedArtistRow[]
): UserTopArtist[] {
	const seen = new Set(listening.map((t) => t.artist.mbid));
	const merged = [...listening];
	for (const r of liked) {
		if (seen.has(r.mbid)) continue;
		seen.add(r.mbid);
		merged.push({
			artist: toArtist({ item_idx: r.itemIdx, mbid: r.mbid, name: r.name, score: 1 }),
			plays: 0
		});
	}
	return merged.slice(0, MAX_TOP_ARTISTS_ROW);
}

/** Full user with top artists (train_edges + user_artist_likes). */
export async function getUserWithTopArtists(userIdx: number): Promise<User | null> {
	const userRows = await db.execute<UserRow>(sql`
		SELECT user_idx, sha1, display_name, avatar_url
		FROM users
		WHERE user_idx = ${userIdx}
		LIMIT 1
	`);
	const u = userRows.rows[0];
	if (!u) return null;

	// train_edges may have been created without a plays column (e.g. by Drizzle before it was added).
	// Select only columns that always exist; use 1 for plays so the app works either way.
	const artistRows = await db.execute<ArtistRow & { plays: number }>(sql`
		SELECT a.item_idx, a.mbid, a.name, 1 AS plays
		FROM train_edges t
		INNER JOIN artists a ON a.item_idx = t.item_idx
		WHERE t.user_idx = ${userIdx}
		ORDER BY a.item_idx
		LIMIT 20
	`);

	const listeningTop: UserTopArtist[] = artistRows.rows.map((r) => ({
		artist: toArtist({ item_idx: r.item_idx, mbid: r.mbid, name: r.name, score: 1 }),
		plays: r.plays
	}));

	const likedRows = await getUserLikes(userIdx);
	const topArtists = mergeListeningAndLikedTopArtists(listeningTop, likedRows);

	return {
		id: String(u.user_idx),
		sha1: u.sha1,
		displayName: u.display_name ?? `User #${u.user_idx}`,
		userIdx: u.user_idx,
		avatarUrl: u.avatar_url,
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
		avatarUrl: r.avatar_url,
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
		SELECT u.user_idx, u.sha1, u.display_name, u.avatar_url, 1 AS plays
		FROM train_edges t
		INNER JOIN users u ON u.user_idx = t.user_idx
		WHERE t.item_idx = ${itemIdx}
		ORDER BY u.user_idx
		LIMIT ${limit}
	`);

	return rows.rows.map((r) => ({
		user: toMinimalUser(r),
		plays: r.plays
	}));
}
