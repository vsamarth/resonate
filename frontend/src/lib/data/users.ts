import type { User } from '$lib/types';
import { artists } from './artists';

const [
	redHot, arctic, strokes, dieArzte, betty, melissa, blackDahlia,
	elvenking, juliette, magica, nofx, alkaline, misfits, tmbg,
	coldplay, nirvana, radiohead, metallica, whiteStripes, daftPunk
] = artists;

export const users: User[] = [
	{
		id: '0',
		sha1: '00000c28',
		displayName: 'User #0',
		topArtists: [
			{ artist: betty, plays: 2137 },
			{ artist: dieArzte, plays: 1099 },
			{ artist: melissa, plays: 897 },
			{ artist: elvenking, plays: 717 },
			{ artist: juliette, plays: 706 },
			{ artist: redHot, plays: 691 },
			{ artist: magica, plays: 545 },
			{ artist: blackDahlia, plays: 507 }
		]
	},
	{
		id: '1',
		sha1: '1a2b3c4d',
		displayName: 'User #1',
		topArtists: [
			{ artist: nirvana, plays: 3412 },
			{ artist: radiohead, plays: 2891 },
			{ artist: arctic, plays: 2310 },
			{ artist: strokes, plays: 1780 },
			{ artist: whiteStripes, plays: 1540 },
			{ artist: redHot, plays: 1280 },
			{ artist: coldplay, plays: 980 },
			{ artist: tmbg, plays: 740 }
		]
	},
	{
		id: '2',
		sha1: '2c3d4e5f',
		displayName: 'User #2',
		topArtists: [
			{ artist: metallica, plays: 4210 },
			{ artist: misfits, plays: 3180 },
			{ artist: blackDahlia, plays: 2760 },
			{ artist: elvenking, plays: 2110 },
			{ artist: magica, plays: 1830 },
			{ artist: nofx, plays: 1540 },
			{ artist: alkaline, plays: 1290 },
			{ artist: dieArzte, plays: 970 }
		]
	},
	{
		id: '3',
		sha1: '3e4f5a6b',
		displayName: 'User #3',
		topArtists: [
			{ artist: daftPunk, plays: 5120 },
			{ artist: coldplay, plays: 3940 },
			{ artist: radiohead, plays: 3210 },
			{ artist: arctic, plays: 2680 },
			{ artist: strokes, plays: 2340 },
			{ artist: nirvana, plays: 1870 },
			{ artist: tmbg, plays: 1430 },
			{ artist: melissa, plays: 980 }
		]
	},
	{
		id: '4',
		sha1: '4f5a6b7c',
		displayName: 'User #4',
		topArtists: [
			{ artist: redHot, plays: 3890 },
			{ artist: arctic, plays: 3120 },
			{ artist: nirvana, plays: 2540 },
			{ artist: strokes, plays: 2190 },
			{ artist: metallica, plays: 1860 },
			{ artist: whiteStripes, plays: 1530 },
			{ artist: misfits, plays: 1240 },
			{ artist: nofx, plays: 910 }
		]
	}
];

export function getUserById(id: string): User | undefined {
	return users.find((u) => u.id === id);
}

export function getTopListenersForArtist(mbid: string, limit = 5): Array<{ user: User; plays: number }> {
	const result: Array<{ user: User; plays: number }> = [];
	for (const user of users) {
		const entry = user.topArtists.find((ta) => ta.artist.mbid === mbid);
		if (entry) result.push({ user, plays: entry.plays });
	}
	return result.sort((a, b) => b.plays - a.plays).slice(0, limit);
}
