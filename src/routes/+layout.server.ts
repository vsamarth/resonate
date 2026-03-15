import { getUsersWithProfiles, getUserWithTopArtists } from '$lib/server/users';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const [users, defaultUser] = await Promise.all([
		getUsersWithProfiles(10),
		getUserWithTopArtists(0)
	]);
	return {
		users,
		defaultUser: defaultUser ?? null
	};
};
