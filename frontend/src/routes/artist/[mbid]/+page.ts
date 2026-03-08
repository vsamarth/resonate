import { getArtistByMbid } from '$lib/data/artists';
import { getArtistData } from '$lib/api/wikipedia';
import { getMbArtist } from '$lib/api/musicbrainz';
import {
	fetchArtistByMbid,
	fetchSimilarArtists,
	titleCase,
	gradientFromMbid,
} from '$lib/api/recommendations';
import type { Artist } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const staticArtist = getArtistByMbid(params.mbid);

	// Step 1: Fetch MusicBrainz metadata + backend artist info in parallel.
	// MusicBrainz gives us the canonical name (for Wikipedia) and enrichment data.
	// The backend gives us the item_idx needed for similar-artist lookup.
	const [mbResult, apiResult] = await Promise.allSettled([
		getMbArtist(params.mbid),
		fetchArtistByMbid(params.mbid),
	]);

	const mb = mbResult.status === 'fulfilled' ? mbResult.value : null;
	const api = apiResult.status === 'fulfilled' ? apiResult.value : null;

	// Resolve best display name: static catalog → MusicBrainz → model dataset → mbid
	const artistName =
		staticArtist?.name ??
		mb?.name ??
		(api ? titleCase(api.name) : null) ??
		params.mbid;

	const itemIdx = api?.item_idx ?? null;

	// Step 2: Fetch Wikipedia bio + model similar artists in parallel (both need info from step 1).
	const [wikiResult, similarResult] = await Promise.allSettled([
		getArtistData(artistName),
		itemIdx !== null ? fetchSimilarArtists(itemIdx, 8) : Promise.resolve([]),
	]);

	const wikiData = wikiResult.status === 'fulfilled' ? wikiResult.value : null;
	const modelSimilar = similarResult.status === 'fulfilled' ? similarResult.value : [];

	// Build the artist object — prefer static catalog, fall back to a stub enriched from MB/API.
	const artist: Artist = staticArtist ?? {
		mbid: params.mbid,
		name: artistName,
		genre: mb?.tags?.[0]?.name ?? '',
		country: mb?.country ?? '',
		totalPlays: 0,
		listenerCount: 0,
		gradient: gradientFromMbid(params.mbid),
		similarMbids: [],
	};

	return {
		artist,
		imageUrl: wikiData?.imageUrl ?? null,
		extract: wikiData?.extract ?? null,
		mbTags: mb?.tags ?? [],
		mbFormed: mb?.formed ?? null,
		mbType: mb?.type ?? null,
		modelSimilar,
	};
};
