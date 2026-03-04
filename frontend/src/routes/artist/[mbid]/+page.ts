import { error } from '@sveltejs/kit';
import { getArtistByMbid } from '$lib/data/artists';
import { getArtistData } from '$lib/api/wikipedia';
import { getMbArtist } from '$lib/api/musicbrainz';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const artist = getArtistByMbid(params.mbid);
	if (!artist) throw error(404, 'Artist not found');

	// Fetch enrichment data in parallel — both fail gracefully.
	const [wikiData, mbArtist] = await Promise.allSettled([
		getArtistData(artist.name),
		getMbArtist(params.mbid)
	]);

	return {
		artist,
		imageUrl: wikiData.status === 'fulfilled' ? wikiData.value.imageUrl : null,
		extract: wikiData.status === 'fulfilled' ? wikiData.value.extract : null,
		mbTags: mbArtist.status === 'fulfilled' ? (mbArtist.value?.tags ?? []) : [],
		mbFormed: mbArtist.status === 'fulfilled' ? (mbArtist.value?.formed ?? null) : null,
		mbType: mbArtist.status === 'fulfilled' ? (mbArtist.value?.type ?? null) : null
	};
};
