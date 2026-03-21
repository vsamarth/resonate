import type { User } from '$lib/types';

/** Resolve Resonate `user_idx` from Better Auth user (additional field or synthetic email). */
export function getResonateUserIdx(user: {
	email: string;
	resonateUserIdx?: number | null;
}): number | null {
	if (typeof user.resonateUserIdx === 'number') {
		return user.resonateUserIdx;
	}
	const m = /^profile\+(\d+)@example\.com$/i.exec(user.email);
	return m ? Number(m[1]) : null;
}

/** Signed in with email/password but not linked to a dataset row — no borrowed profile. */
export function userFromAuthSession(sessionUser: {
	id: string;
	name: string;
	email: string;
	image?: string | null;
}): User {
	const displayName =
		sessionUser.name?.trim() ||
		sessionUser.email.split('@')[0] ||
		'You';
	return {
		id: sessionUser.id,
		sha1: '',
		displayName,
		userIdx: null,
		topArtists: [],
		avatarUrl: sessionUser.image ?? null
	};
}
