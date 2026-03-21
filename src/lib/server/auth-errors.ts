import { APIError } from 'better-auth';

/** Synthetic emails used for dataset impersonation — block real sign-up on these. */
export function isReservedImpersonationEmail(email: string): boolean {
	return /^profile\+\d+@example\.com$/i.test(email.trim());
}

export function messageFromAuthError(e: unknown, fallback: string): string {
	if (e instanceof APIError) {
		const m = typeof e.message === 'string' ? e.message.trim() : '';
		return m || fallback;
	}
	if (e instanceof Error && e.message) return e.message;
	return fallback;
}
