const cache = new Map<string, MbArtist>();

export interface MbArtist {
	name: string;
	tags: { name: string; count: number }[];
	/** ISO 3166-1 two-letter country code */
	country: string | null;
	/** "group" | "person" | "orchestra" etc. */
	type: string | null;
	/** Year of formation / birth */
	formed: string | null;
}

export async function getMbArtist(mbid: string): Promise<MbArtist | null> {
	if (cache.has(mbid)) return cache.get(mbid)!;

	const url = `https://musicbrainz.org/ws/2/artist/${mbid}?fmt=json&inc=tags`;

	try {
		const res = await fetch(url, {
			headers: {
				// MusicBrainz requires a descriptive User-Agent for server-side calls.
				// Browsers send their own UA automatically.
				'User-Agent': 'LightGCN-Music-Demo/0.1 (https://github.com/lightgcn)'
			}
		});
		if (!res.ok) throw new Error(`MusicBrainz ${res.status}`);
		const data = await res.json();

		const artist: MbArtist = {
			name: data.name,
			tags: (data.tags ?? []).sort(
				(a: { count: number }, b: { count: number }) => b.count - a.count
			),
			country: data.country ?? null,
			type: data.type ?? null,
			formed: data['life-span']?.begin?.slice(0, 4) ?? null
		};

		cache.set(mbid, artist);
		return artist;
	} catch {
		cache.set(mbid, { name: '', tags: [], country: null, type: null, formed: null });
		return null;
	}
}
