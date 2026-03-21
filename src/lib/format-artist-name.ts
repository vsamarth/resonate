/**
 * Title-style display: first letter of each word uppercased, the rest lowercased.
 */
export function formatArtistName(name: string): string {
	if (!name || !name.trim()) return name;
	return name
		.trim()
		.split(/\s+/)
		.map((word) => {
			if (word.length === 0) return word;
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		})
		.join(' ');
}
