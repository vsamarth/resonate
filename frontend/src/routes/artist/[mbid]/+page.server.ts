import { getArtistByMbid } from '$lib/data/artists';
import { getArtistData } from '$lib/api/wikipedia';
import { getMbArtist } from '$lib/api/musicbrainz';
import {
	getArtistByMbid as getDbArtist,
	getSimilarArtists
} from '$lib/server/recommendations';
import { getTopListenersForArtist } from '$lib/server/users';
import { gradientFromMbid, titleCase, toArtist } from '$lib/api/recommendations';
import type { Artist } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const staticArtist = getArtistByMbid(params.mbid);

	// Fetch MusicBrainz metadata + DB artist info in parallel
	const [mbResult, dbResult] = await Promise.allSettled([
		getMbArtist(params.mbid),
		getDbArtist(params.mbid)
	]);

	const mb = mbResult.status === 'fulfilled' ? mbResult.value : null;
	const dbArtist = dbResult.status === 'fulfilled' ? dbResult.value : null;

	const artistName =
		staticArtist?.name ??
		mb?.name ??
		(dbArtist ? titleCase(dbArtist.name) : null) ??
		params.mbid;

	const itemIdx = dbArtist?.item_idx ?? null;

	// Fetch Wikipedia bio + similar artists in parallel
	const [wikiResult, similarResult] = await Promise.allSettled([
		getArtistData(artistName),
		itemIdx !== null ? getSimilarArtists(itemIdx, 8) : Promise.resolve([])
	]);

	const wikiData = wikiResult.status === 'fulfilled' ? wikiResult.value : null;
	const modelSimilar =
		similarResult.status === 'fulfilled'
			? similarResult.value.map((r) => toArtist(r))
			: [];

	const artist: Artist = staticArtist ?? {
		mbid: params.mbid,
		name: artistName,
		genre: mb?.tags?.[0]?.name ?? '',
		country: mb?.country ?? '',
		totalPlays: 0,
		listenerCount: 0,
		gradient: gradientFromMbid(params.mbid),
		similarMbids: []
	};

	const topListeners = await getTopListenersForArtist(params.mbid, 5);

	return {
		artist,
		imageUrl: wikiData?.imageUrl ?? null,
		extract: wikiData?.extract ?? null,
		mbTags: mb?.tags ?? [],
		mbFormed: mb?.formed ?? null,
		mbType: mb?.type ?? null,
		modelSimilar,
		topListeners
	};
};
