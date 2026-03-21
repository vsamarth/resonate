import { error, type RequestEvent } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { getResonateUserIdx } from '$lib/server/session-user';

/** Ensures the session maps to the same Resonate `user_idx` as the URL/body. */
export async function requireMatchingResonateUser(event: RequestEvent, userIdx: number) {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');
	const idx = getResonateUserIdx(session.user);
	if (idx !== userIdx) throw error(403, 'Forbidden');
}
