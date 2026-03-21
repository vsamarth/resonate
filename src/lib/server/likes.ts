import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { artists, authArtistLikes, userArtistLikes } from '$lib/db/schema';

export interface LikedArtistRow {
	itemIdx: number;
	mbid: string;
	name: string;
}

export async function getUserLikes(userIdx: number): Promise<LikedArtistRow[]> {
	const rows = await db
		.select({
			itemIdx: artists.itemIdx,
			mbid: artists.mbid,
			name: artists.name
		})
		.from(userArtistLikes)
		.innerJoin(artists, eq(userArtistLikes.itemIdx, artists.itemIdx))
		.where(eq(userArtistLikes.userIdx, userIdx))
		.orderBy(desc(userArtistLikes.createdAt));
	return rows;
}

export async function getAuthUserLikes(userId: string): Promise<LikedArtistRow[]> {
	const rows = await db
		.select({
			itemIdx: artists.itemIdx,
			mbid: artists.mbid,
			name: artists.name
		})
		.from(authArtistLikes)
		.innerJoin(artists, eq(authArtistLikes.itemIdx, artists.itemIdx))
		.where(eq(authArtistLikes.userId, userId))
		.orderBy(desc(authArtistLikes.createdAt));
	return rows;
}

export async function isArtistLiked(userIdx: number, itemIdx: number): Promise<boolean> {
	const rows = await db
		.select({ userIdx: userArtistLikes.userIdx })
		.from(userArtistLikes)
		.where(and(eq(userArtistLikes.userIdx, userIdx), eq(userArtistLikes.itemIdx, itemIdx)))
		.limit(1);
	return rows.length > 0;
}

export async function addArtistLike(userIdx: number, itemIdx: number): Promise<void> {
	await db.insert(userArtistLikes).values({ userIdx, itemIdx }).onConflictDoNothing();
}

export async function removeArtistLike(userIdx: number, itemIdx: number): Promise<void> {
	await db
		.delete(userArtistLikes)
		.where(and(eq(userArtistLikes.userIdx, userIdx), eq(userArtistLikes.itemIdx, itemIdx)));
}
