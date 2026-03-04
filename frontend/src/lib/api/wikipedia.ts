const cache = new Map<string, { imageUrl: string | null; extract: string | null }>();

interface WikiResponse {
	query: {
		pages: Record<string, {
			thumbnail?: { source: string };
			extract?: string;
		}>;
	};
}

async function fetchWiki(name: string): Promise<{ imageUrl: string | null; extract: string | null }> {
	if (cache.has(name)) return cache.get(name)!;

	const base = 'https://en.wikipedia.org/w/api.php';
	const params = new URLSearchParams({
		action: 'query',
		titles: name,
		prop: 'pageimages|extracts',
		pithumbsize: '600',
		exintro: 'true',
		explaintext: 'true',
		exsentences: '4',
		format: 'json',
		origin: '*'
	});

	try {
		const res = await fetch(`${base}?${params}`);
		if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
		const data: WikiResponse = await res.json();
		const pages = Object.values(data.query.pages);
		const page = pages[0];

		const result = {
			imageUrl: page?.thumbnail?.source ?? null,
			extract: page?.extract?.trim() || null
		};
		cache.set(name, result);
		return result;
	} catch {
		const result = { imageUrl: null, extract: null };
		cache.set(name, result);
		return result;
	}
}

export async function getArtistImage(artistName: string): Promise<string | null> {
	const { imageUrl } = await fetchWiki(artistName);
	return imageUrl;
}

export async function getArtistData(
	artistName: string
): Promise<{ imageUrl: string | null; extract: string | null }> {
	return fetchWiki(artistName);
}
