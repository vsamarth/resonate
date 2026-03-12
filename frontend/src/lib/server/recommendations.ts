/**
 * Server-only helpers that query Postgres/pgvector.
 * Import only from +page.server.ts / +server.ts files.
 */
import { sql } from 'drizzle-orm';
import { db } from '$lib/db';

export interface ArtistRow {
	item_idx: number;
	mbid: string;
	name: string;
	score: number;
}

export interface ArtistInfo {
	item_idx: number;
	mbid: string;
	name: string;
}

/**
 * Top-k artist recommendations for a user using dot-product similarity,
 * with training-set items masked out.
 */
export async function getRecommendations(userIdx: number, k = 10): Promise<ArtistRow[]> {
	const rows = await db.execute<ArtistRow>(sql`
		SELECT
			a.item_idx,
			a.mbid,
			a.name,
			-(a.embedding <#> u.embedding) AS score
		FROM artists a
		CROSS JOIN (
			SELECT embedding FROM users WHERE user_idx = ${userIdx}
		) u
		WHERE a.item_idx NOT IN (
			SELECT item_idx FROM train_edges WHERE user_idx = ${userIdx}
		)
		ORDER BY a.embedding <#> u.embedding
		LIMIT ${k}
	`);
	return rows.rows;
}

/**
 * k nearest artists in cosine-similarity space (excludes self).
 */
export async function getSimilarArtists(itemIdx: number, k = 6): Promise<ArtistRow[]> {
	const rows = await db.execute<ArtistRow>(sql`
		SELECT
			a.item_idx,
			a.mbid,
			a.name,
			1 - (a.embedding <=> ref.embedding) AS score
		FROM artists a
		CROSS JOIN (
			SELECT embedding FROM artists WHERE item_idx = ${itemIdx}
		) ref
		WHERE a.item_idx != ${itemIdx}
		ORDER BY a.embedding <=> ref.embedding
		LIMIT ${k}
	`);
	return rows.rows;
}

/**
 * Look up a single artist by MusicBrainz ID.
 */
export async function getArtistByMbid(mbid: string): Promise<ArtistInfo | null> {
	const rows = await db.execute<ArtistInfo>(sql`
		SELECT item_idx, mbid, name
		FROM artists
		WHERE mbid = ${mbid}
		LIMIT 1
	`);
	return rows.rows[0] ?? null;
}
