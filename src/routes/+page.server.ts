import { getGuestDiscoverArtists } from '$lib/data/artists';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { signedIn } = await parent();
	if (signedIn) return {};
	return { guestDiscover: getGuestDiscoverArtists() };
};
