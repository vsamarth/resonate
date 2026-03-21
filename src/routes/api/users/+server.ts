import { json } from '@sveltejs/kit';
import { getUsersWithProfiles } from '$lib/server/users';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 20);
	const users = await getUsersWithProfiles(limit);
	return json(users);
};
