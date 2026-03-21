import { env } from '$env/dynamic/private';

/** Stable synthetic email per dataset user (valid for Better Auth / zod email). */
export function impersonationEmail(userIdx: number): string {
	return `profile+${userIdx}@example.com`;
}

export function getImpersonatePassword(): string {
	const p = env.RESONATE_IMPERSONATE_PASSWORD;
	if (!p || p.length < 8) {
		throw new Error(
			'RESONATE_IMPERSONATE_PASSWORD must be set (min 8 characters). Used only server-side for demo sign-in.'
		);
	}
	return p;
}
