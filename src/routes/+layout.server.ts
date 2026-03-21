import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import {
	getUsersWithProfiles,
	getUserWithTopArtists,
	getFirstUserIdx
} from '$lib/server/users';
import { getResonateUserIdx } from '$lib/server/session-user';
import type { LayoutServerLoad } from './$types';

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
				signedIn: false as const
			};
		}

		const users = await getUsersWithProfiles(100);
		const resonateIdx = getResonateUserIdx(session.user);

		let defaultUser = resonateIdx != null ? await getUserWithTopArtists(resonateIdx) : null;
		if (!defaultUser && users.length > 0) {
			defaultUser = await getUserWithTopArtists(users[0].userIdx);
		}
		if (!defaultUser) {
			const firstIdx = await getFirstUserIdx();
			if (firstIdx != null) {
				defaultUser = await getUserWithTopArtists(firstIdx);
			}
		}

		const userDataStatus: UserDataStatus =
			defaultUser || users.length > 0 ? 'ok' : 'no_users';

		return {
			users,
			defaultUser: defaultUser ?? null,
			userDataStatus,
			signedIn: true as const
		};
	} catch (err) {
		console.error('[layout] user data load failed:', err);
		return {
			users: [],
			defaultUser: null,
			userDataStatus: 'database_unavailable' as const,
			signedIn: Boolean(session?.user) as boolean
		};
	}
};
