import { APIError } from 'better-auth';
import type { User } from '$lib/types';
import { auth } from '$lib/server/auth';
import { getImpersonatePassword, impersonationEmail } from '$lib/server/impersonation';
import { getUserWithTopArtists } from '$lib/server/users';

export async function signInAsDatasetUser(
	headers: Headers,
	userIdx: number
): Promise<{ user: User }> {
	const fullUser = await getUserWithTopArtists(userIdx);
	if (!fullUser) {
		throw new Error('USER_NOT_FOUND');
	}

	const email = impersonationEmail(userIdx);
	const password = getImpersonatePassword();

	try {
		await auth.api.signInEmail({
			body: { email, password, rememberMe: true },
			headers
		});
	} catch (e: unknown) {
		const unauthorized =
			e instanceof APIError && (e.status === 'UNAUTHORIZED' || e.statusCode === 401);
		if (!unauthorized) {
			throw e;
		}
		await auth.api.signUpEmail({
			body: {
				email,
				password,
				name: fullUser.displayName,
				image: fullUser.avatarUrl ?? undefined,
				resonateUserIdx: userIdx
			},
			headers
		});
	}

	return { user: fullUser };
}
