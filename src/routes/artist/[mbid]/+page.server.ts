import { getArtistByMbid } from '$lib/data/artists';
import { getArtistData } from '$lib/api/wikipedia';
import { getMbArtist } from '$lib/api/musicbrainz';
import { fetchLastfmArtistImage } from '$lib/server/lastfm';
import {
	getArtistByMbid as getDbArtist,
	getSimilarArtists,
	getListenerCountForArtist
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

	// Wikipedia bio, similar artists, and Last.fm art in parallel (image prefers Last.fm → wiki in return)
	const [wikiResult, similarResult, lastfmResult] = await Promise.allSettled([
		getArtistData(artistName),
		itemIdx !== null ? getSimilarArtists(itemIdx, 8) : Promise.resolve([]),
		fetchLastfmArtistImage(params.mbid)
	]);

	const wikiData = wikiResult.status === 'fulfilled' ? wikiResult.value : null;
	const lastfmImage = lastfmResult.status === 'fulfilled' ? lastfmResult.value : null;
	const modelSimilar =
		similarResult.status === 'fulfilled'
			? similarResult.value.map((r) => toArtist(r))
			: [];

	// Use DB play counts when available (match dataset)
	const totalPlays = dbArtist?.total_plays ?? staticArtist?.totalPlays ?? 0;
	const listenerCount =
		itemIdx != null ? await getListenerCountForArtist(itemIdx) : 0;

	const artist: Artist = staticArtist ?? {
		mbid: params.mbid,
		name: artistName,
		genre: mb?.tags?.[0]?.name ?? '',
		country: mb?.country ?? '',
		totalPlays,
		listenerCount,
		gradient: gradientFromMbid(params.mbid),
		similarMbids: []
	};
	// Override with DB stats when we have them (so dataset plays are correct even for static artists)
	if (dbArtist != null) {
		artist.totalPlays = totalPlays;
		artist.listenerCount = listenerCount;
	}

	const topListeners = await getTopListenersForArtist(params.mbid, 5);

	return {
		artist,
		imageUrl: lastfmImage ?? wikiData?.imageUrl ?? null,
		extract: wikiData?.extract ?? null,
		mbTags: mb?.tags ?? [],
		mbFormed: mb?.formed ?? null,
		mbType: mb?.type ?? null,
		modelSimilar,
		topListeners
	};
};
