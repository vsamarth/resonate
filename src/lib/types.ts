export interface Artist {
	mbid: string;
	name: string;
	genre: string;
	country: string;
	totalPlays: number;
	listenerCount: number;
	/** Tailwind gradient classes for the artwork placeholder */
	gradient: string;
	similarMbids: string[];
}

export interface UserTopArtist {
	artist: Artist;
	plays: number;
}

export interface User {
	id: string;
	sha1: string;
	displayName: string;
	topArtists: UserTopArtist[];
	/** Integer index into the Resonate embedding matrix (0 … n_users-1) */
	userIdx: number;
	avatarUrl?: string | null;
}

/** User list item from DB (for switcher/search). */
export interface ListUser {
	id: string;
	userIdx: number;
	sha1: string;
	displayName: string;
	avatarUrl: string | null;
}

export interface Recommendation {
	artist: Artist;
	score: number;
	reason?: string;
}

export interface UserRecommendations {
	userId: string;
	items: Recommendation[];
}

/** Root layout: Postgres reachable and seeded vs not */
export type UserDataStatus = 'ok' | 'no_users' | 'database_unavailable';
