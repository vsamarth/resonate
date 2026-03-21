import { sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/db';
import { getAuthUserLikes } from '$lib/server/likes';
import { getUsersWithProfiles, getUserWithTopArtists, mergeListeningAndLikedTopArtists } from '$lib/server/users';
import { getResonateUserIdx, userFromAuthSession } from '$lib/server/session-user';
import { countAuthUserLikes, countDatasetUserLikes } from '$lib/server/onboarding';
import type { LayoutServerLoad } from './$types';

async function getOnboardingArtistPool(limit = 20): Promise<{ mbid: string; name: string }[]> {
	const rows = await db.execute<{ mbid: string; name: string }>(sql`
		SELECT mbid, name FROM artists ORDER BY total_plays DESC NULLS LAST LIMIT ${limit}
	`);
	return rows.rows;
}

export type UserDataStatus = 'ok' | 'no_users' | 'database_unavailable';

/** Routes that work without Better Auth (browse before sign-in). */
function isPublicPath(pathname: string): boolean {
	if (pathname.startsWith('/api/')) return true;
	if (pathname.includes('.')) return true;
	if (pathname === '/sign-in') return true;
	if (pathname === '/') return true;
	if (pathname.startsWith('/search')) return true;
	if (pathname.startsWith('/artist/')) return true;
	return false;
}

export const load: LayoutServerLoad = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	const path = event.url.pathname;

	if (!session?.user && !isPublicPath(path)) {
		const q = event.url.searchParams.get('redirect');
		const next = q && q.startsWith('/') ? q : path;
		throw redirect(303, `/sign-in?redirect=${encodeURIComponent(next === '/sign-in' ? '/' : next)}`);
	}

	try {
		if (!session?.user) {
			return {
				users: [],
				defaultUser: null,
				userDataStatus: 'ok' as const,
				signedIn: false as const,
				onboardingRequired: false as const,
				onboardingArtistPool: [] as { mbid: string; name: string }[]
			};
		}

		const users = await getUsersWithProfiles(100);
		const resonateIdx = getResonateUserIdx(session.user);

		let defaultUser =
			resonateIdx != null ? await getUserWithTopArtists(resonateIdx) : null;
		/** Email sign-ups have no `resonateUserIdx`; do not substitute another listener’s profile. */
		if (!defaultUser) {
			defaultUser = userFromAuthSession(session.user);
		}

		if (defaultUser && resonateIdx == null) {
			try {
				const liked = await getAuthUserLikes(session.user.id);
				defaultUser = {
					...defaultUser,
					topArtists: mergeListeningAndLikedTopArtists(defaultUser.topArtists, liked)
				};
			} catch (e) {
				console.warn('[layout] auth liked artists for top row failed', e);
			}
		}

		const userDataStatus: UserDataStatus =
			defaultUser || users.length > 0 ? 'ok' : 'no_users';

		let onboardingRequired = false;
		if (userDataStatus === 'ok' && defaultUser) {
			let likeCount = 0;
			try {
				likeCount =
					resonateIdx != null
						? await countDatasetUserLikes(resonateIdx)
						: await countAuthUserLikes(session.user.id);
			} catch (e) {
				// e.g. `auth_artist_likes` missing before migration — treat as no likes so onboarding can show
				console.warn('[layout] like count failed (run db:migrate if needed)', e);
				likeCount = 0;
			}
			const topLen = defaultUser.topArtists.length;
			onboardingRequired = likeCount < 3 && (resonateIdx == null || topLen === 0);
		}

		let onboardingArtistPool: { mbid: string; name: string }[] = [];
		try {
			onboardingArtistPool = await getOnboardingArtistPool(20);
		} catch (e) {
			console.warn('[layout] onboardingArtistPool', e);
		}

		return {
			users,
			defaultUser: defaultUser ?? null,
			userDataStatus,
			signedIn: true as const,
			onboardingRequired,
			onboardingArtistPool
		};
	} catch (err) {
		console.error('[layout] user data load failed:', err);
		return {
			users: [],
			defaultUser: null,
			userDataStatus: 'database_unavailable' as const,
			signedIn: Boolean(session?.user) as boolean,
			onboardingRequired: false as const,
			onboardingArtistPool: [] as { mbid: string; name: string }[]
		};
	}
};
