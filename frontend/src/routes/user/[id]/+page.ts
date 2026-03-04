import { error } from '@sveltejs/kit';
import { getUserById } from '$lib/data/users';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const user = getUserById(params.id);
	if (!user) throw error(404, 'User not found');
	return { user };
};
