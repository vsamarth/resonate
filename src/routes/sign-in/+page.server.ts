import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth';
import { auth } from '$lib/server/auth';
import { isReservedImpersonationEmail, messageFromAuthError } from '$lib/server/auth-errors';
import { getUsersWithProfiles } from '$lib/server/users';
import { signInAsDatasetUser } from '$lib/server/resonate-session';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LEN = 8;

function redirectTarget(event: { url: URL }): string {
	const redirectToRaw = event.url.searchParams.get('redirect') || '/';
	return redirectToRaw.startsWith('/') && !redirectToRaw.startsWith('//') ? redirectToRaw : '/';
}

export const load: PageServerLoad = async (event) => {
	const existing = await auth.api.getSession({ headers: event.request.headers });
	if (existing?.user) {
		throw redirect(303, '/');
	}
	try {
		const users = await getUsersWithProfiles(20);
		const userDataStatus = users.length > 0 ? ('ok' as const) : ('no_users' as const);
		return { users, userDataStatus };
	} catch {
		return { users: [], userDataStatus: 'database_unavailable' as const };
	}
};

export const actions: Actions = {
	register: async (event) => {
		const redirectTo = redirectTarget(event);
		const fd = await event.request.formData();
		const nameField = fd.get('name');
		const emailField = fd.get('email');
		const passwordField = fd.get('password');
		const confirmField = fd.get('confirmPassword');
		const name = typeof nameField === 'string' ? nameField.trim() : '';
		const email = typeof emailField === 'string' ? emailField.trim().toLowerCase() : '';
		const password = typeof passwordField === 'string' ? passwordField : '';
		const confirm = typeof confirmField === 'string' ? confirmField : '';

		if (!name) return fail(400, { message: 'Enter your name.', mode: 'signup' as const, name, email });
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, {
				message: 'Enter a valid email address.',
				mode: 'signup' as const,
				name,
				email
			});
		}
		if (isReservedImpersonationEmail(email)) {
			return fail(400, {
				message: 'This email pattern is reserved for demo profiles. Use another address.',
				mode: 'signup' as const,
				name,
				email
			});
		}
		if (password.length < MIN_PASSWORD_LEN) {
			return fail(400, {
				message: `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
				mode: 'signup' as const,
				name,
				email
			});
		}
		if (password !== confirm) {
			return fail(400, {
				message: 'Passwords do not match.',
				mode: 'signup' as const,
				name,
				email
			});
		}

		try {
			await auth.api.signUpEmail({
				body: { name, email, password, rememberMe: true },
				headers: event.request.headers
			});
		} catch (e: unknown) {
			console.error('[sign-up]', e);
			return fail(400, {
				message: messageFromAuthError(e, 'Could not create account. Try a different email.'),
				mode: 'signup' as const,
				name,
				email
			});
		}

		throw redirect(303, redirectTo);
	},

	emailSignIn: async (event) => {
		const redirectTo = redirectTarget(event);
		const fd = await event.request.formData();
		const emailField = fd.get('email');
		const passwordField = fd.get('password');
		const email = typeof emailField === 'string' ? emailField.trim().toLowerCase() : '';
		const password = typeof passwordField === 'string' ? passwordField : '';

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, {
				message: 'Enter a valid email address.',
				mode: 'signin' as const,
				email
			});
		}
		if (!password) {
			return fail(400, { message: 'Enter your password.', mode: 'signin' as const, email });
		}

		try {
			await auth.api.signInEmail({
				body: { email, password, rememberMe: true },
				headers: event.request.headers
			});
		} catch (e: unknown) {
			if (e instanceof APIError && (e.status === 'UNAUTHORIZED' || e.statusCode === 401)) {
				return fail(400, {
					message: 'Invalid email or password.',
					mode: 'signin' as const,
					email
				});
			}
			console.error('[email sign-in]', e);
			return fail(500, {
				message: messageFromAuthError(e, 'Could not sign in. Try again.'),
				mode: 'signin' as const,
				email
			});
		}

		throw redirect(303, redirectTo);
	},

	signIn: async (event) => {
		const redirectTo = redirectTarget(event);

		const fd = await event.request.formData();
		const raw = fd.get('userIdx');
		const userIdx = typeof raw === 'string' ? Number(raw) : NaN;
		if (!Number.isInteger(userIdx) || userIdx < 0) {
			return fail(400, { message: 'Choose a valid profile.', mode: 'dataset' as const });
		}

		try {
			await signInAsDatasetUser(event.request.headers, userIdx);
		} catch (e: unknown) {
			if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
				return fail(400, { message: 'That profile was not found.', mode: 'dataset' as const });
			}
			console.error('[sign-in]', e);
			return fail(500, { message: 'Could not sign in. Try again.', mode: 'dataset' as const });
		}

		throw redirect(303, redirectTo);
	}
};
