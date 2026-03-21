import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { getUsersWithProfiles } from '$lib/server/users';
import { signInAsDatasetUser } from '$lib/server/resonate-session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const existing = await auth.api.getSession({ headers: event.request.headers });
	if (existing?.user) {
		throw redirect(303, '/');
	}
	try {
		const users = await getUsersWithProfiles(100);
		const userDataStatus = users.length > 0 ? ('ok' as const) : ('no_users' as const);
		return { users, userDataStatus };
	} catch {
		return { users: [], userDataStatus: 'database_unavailable' as const };
	}
};

export const actions: Actions = {
	signIn: async (event) => {
		const redirectToRaw = event.url.searchParams.get('redirect') || '/';
		const redirectTo =
			redirectToRaw.startsWith('/') && !redirectToRaw.startsWith('//') ? redirectToRaw : '/';

		const fd = await event.request.formData();
		const raw = fd.get('userIdx');
		const userIdx = typeof raw === 'string' ? Number(raw) : NaN;
		if (!Number.isInteger(userIdx) || userIdx < 0) {
			return fail(400, { message: 'Choose a valid profile.' });
		}

		try {
			await signInAsDatasetUser(event.request.headers, userIdx);
		} catch (e: unknown) {
			if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
				return fail(400, { message: 'That profile was not found.' });
			}
			console.error('[sign-in]', e);
			return fail(500, { message: 'Could not sign in. Try again.' });
		}

		throw redirect(303, redirectTo);
	}
};
