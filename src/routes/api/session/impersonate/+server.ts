import { error, json, type RequestHandler } from '@sveltejs/kit';
import { signInAsDatasetUser } from '$lib/server/resonate-session';

export const POST: RequestHandler = async (event) => {
	let body: { userIdx?: unknown };
	try {
		body = await event.request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}
	const userIdx = body.userIdx;
	if (typeof userIdx !== 'number' || !Number.isInteger(userIdx) || userIdx < 0) {
		throw error(400, 'userIdx must be a non-negative integer');
	}

	try {
		const { user } = await signInAsDatasetUser(event.request.headers, userIdx);
		return json({ ok: true, user });
	} catch (e: unknown) {
		if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
			throw error(404, 'User not found');
		}
		console.error('[impersonate]', e);
		throw error(500, 'Sign-in failed');
	}
};
