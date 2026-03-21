import { customType, integer, primaryKey, text, timestamp, pgTable } from 'drizzle-orm/pg-core';

export * from './auth-schema';

// ---------------------------------------------------------------------------
// pgvector custom column type
// ---------------------------------------------------------------------------
function vector(dimensions: number) {
	return customType<{ data: number[]; driverData: string }>({
		dataType() {
			return `vector(${dimensions})`;
		},
		toDriver(value: number[]): string {
			return `[${value.join(',')}]`;
		},
		fromDriver(value: string): number[] {
			return value.slice(1, -1).split(',').map(Number);
		}
	});
}

const EMBED_DIM = 64;

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/** One row per artist / item in the Resonate dataset */
export const artists = pgTable('artists', {
	itemIdx: integer('item_idx').primaryKey(),
	mbid: text('mbid').notNull().unique(),
	name: text('name').notNull(),
	embedding: vector(EMBED_DIM)('embedding').notNull(),
	/** Total plays in the dataset (sum over all user–artist rows) */
	totalPlays: integer('total_plays').notNull().default(0)
});

/** One row per user in the Resonate dataset */
export const users = pgTable('users', {
	userIdx: integer('user_idx').primaryKey(),
	sha1: text('sha1').notNull().unique(),
	embedding: vector(EMBED_DIM)('embedding').notNull(),
	// Personal profile (optional; populated for top users)
	displayName: text('display_name'),
	email: text('email').unique(),
	avatarUrl: text('avatar_url'),
	country: text('country'),
	createdAt: timestamp('created_at', { withTimezone: true })
});

/** Training edges (user listened to this artist) — used to mask recommendations */
export const trainEdges = pgTable(
	'train_edges',
	{
		userIdx: integer('user_idx').notNull(),
		itemIdx: integer('item_idx').notNull(),
		/** Play count for this user–artist in the dataset */
		plays: integer('plays').notNull().default(1)
	},
	(t) => [primaryKey({ columns: [t.userIdx, t.itemIdx] })]
);
