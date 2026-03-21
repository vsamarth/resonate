import { getGuestDiscoverArtists } from '$lib/data/artists';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const p = await parent();
	if (!p.signedIn) {
		return { guestDiscover: getGuestDiscoverArtists() };
	}
	/** Keep layout-only fields (`onboardingRequired`, `defaultUser`) from being overwritten with undefined */
	return {};
};
