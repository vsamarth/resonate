/**
 * Last.fm returns a generic star-on-grey image when they have no real art.
 * Those URLs still look like valid image links, so we treat them as "no image".
 */
const PLACEHOLDER_MARKERS = [
	'2a96cbd8b46e442fc41c2b86b821562f',
	'8482ba91f162111a64c857747a067851'
] as const;

export function isPlaceholderArtistImageUrl(url: string | null | undefined): boolean {
	if (!url?.trim()) return true;
	const u = url.toLowerCase();
	return PLACEHOLDER_MARKERS.some((m) => u.includes(m));
}
