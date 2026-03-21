/**
 * Server-only helpers that query Postgres/pgvector.
 * Import only from +page.server.ts / +server.ts files.
 */
import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/db';
import { artists, userArtistLikes, users } from '$lib/db/schema';

export interface ArtistRow {
	item_idx: number;
	mbid: string;
	name: string;
	score: number;
	[key: string]: unknown;
}

export interface ArtistInfo {
	item_idx: number;
	mbid: string;
	name: string;
	total_plays: number;
	[key: string]: unknown;
}

/** Weight of the dataset user embedding vs. mean of liked-artist embeddings (0–1). */
const RECO_BLEND_LAMBDA = 0.75;

function blendUserEmbedding(base: number[], likedEmbeddings: number[][]): number[] {
	if (likedEmbeddings.length === 0) return base;
	const dim = base.length;
	const mean = new Array(dim).fill(0);
	for (const e of likedEmbeddings) {
		for (let i = 0; i < dim; i++) mean[i] += e[i]!;
	}
	const n = likedEmbeddings.length;
	for (let i = 0; i < dim; i++) mean[i]! /= n;
	const λ = RECO_BLEND_LAMBDA;
	const out = new Array(dim);
	for (let i = 0; i < dim; i++) {
		out[i] = λ * base[i]! + (1 - λ) * mean[i]!;
	}
	const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0));
	if (norm < 1e-12) return base;
	return out.map((v) => v / norm);
}

function vectorLiteralSql(vec: number[]) {
	const s = `[${vec.map((n) => Number(n.toFixed(8))).join(',')}]`;
	return sql.raw(`'${s}'::vector(64)`);
}

/**
 * Top-k artist recommendations for a user using dot-product similarity against a
 * blended query vector (dataset user embedding + mean of liked artists), with
 * training edges and explicit likes masked out.
 */
export async function getRecommendations(userIdx: number, k = 10): Promise<ArtistRow[]> {
	const [userRow] = await db
		.select({ embedding: users.embedding })
		.from(users)
		.where(eq(users.userIdx, userIdx))
		.limit(1);
	if (!userRow) return [];

	const likedRows = await db
		.select({ embedding: artists.embedding })
		.from(userArtistLikes)
		.innerJoin(artists, eq(userArtistLikes.itemIdx, artists.itemIdx))
		.where(eq(userArtistLikes.userIdx, userIdx));

	const uEff = blendUserEmbedding(
		userRow.embedding,
		likedRows.map((r) => r.embedding)
	);
	const vecLit = vectorLiteralSql(uEff);

	const rows = await db.execute<ArtistRow>(sql`
		SELECT
			a.item_idx,
			a.mbid,
			a.name,
			-(a.embedding <#> u.embedding) AS score
		FROM artists a
		CROSS JOIN (SELECT ${vecLit} AS embedding) u
		WHERE a.item_idx NOT IN (
			SELECT item_idx FROM train_edges WHERE user_idx = ${userIdx}
		)
		AND a.item_idx NOT IN (
			SELECT item_idx FROM user_artist_likes WHERE user_idx = ${userIdx}
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
 * Look up a single artist by MusicBrainz ID (includes total_plays from dataset).
 */
export async function getArtistByMbid(mbid: string): Promise<ArtistInfo | null> {
	const rows = await db.execute<ArtistInfo>(sql`
		SELECT item_idx, mbid, name, COALESCE(total_plays, 0) AS total_plays
		FROM artists
		WHERE mbid = ${mbid}
		LIMIT 1
	`);
	return rows.rows[0] ?? null;
}

/**
 * Number of users who have this artist in their history (train_edges).
 */
export async function getListenerCountForArtist(itemIdx: number): Promise<number> {
	const rows = await db.execute<{ count: string }>(sql`
		SELECT count(*)::text AS count FROM train_edges WHERE item_idx = ${itemIdx}
	`);
	return parseInt(rows.rows[0]?.count ?? '0', 10);
}
