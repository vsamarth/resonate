import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from '$lib/db';
import * as authSchema from '$lib/db/auth-schema';

const secret =
	env.BETTER_AUTH_SECRET ??
	(building ? 'build-placeholder-secret-min-32-chars!!' : undefined);
const baseURL = env.BETTER_AUTH_URL ?? (building ? 'http://localhost:5173' : undefined);

if (!building) {
	if (!secret || secret.length < 32) {
		throw new Error('BETTER_AUTH_SECRET must be set (min 32 characters).');
	}
	if (!baseURL) {
		throw new Error('BETTER_AUTH_URL must be set (e.g. http://localhost:5173).');
	}
}

export const auth = betterAuth({
	baseURL: baseURL!,
	secret: secret!,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: authSchema.user,
			session: authSchema.session,
			account: authSchema.account,
			verification: authSchema.verification
		}
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: true
	},
	user: {
		additionalFields: {
			resonateUserIdx: { type: 'number', required: false, input: true }
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});

