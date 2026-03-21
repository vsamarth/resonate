import { fetchLastfmArtistImage } from '$lib/server/lastfm';
import { getArtistImage } from '$lib/api/wikipedia';

/** Last.fm first (by MBID); if missing, Wikipedia thumbnail by display name. */
export async function resolveArtistImageUrl(
	mbid: string,
	artistName: string | null | undefined
): Promise<string | null> {
	const lastfm = await fetchLastfmArtistImage(mbid);
	if (lastfm) return lastfm;
	const name = artistName?.trim();
	if (!name) return null;
	return getArtistImage(name);
}
