import type { UserRecommendations } from '$lib/types';
import { artists } from './artists';

const [
	redHot, arctic, strokes, dieArzte, betty, melissa, blackDahlia,
	elvenking, juliette, magica, nofx, alkaline, misfits, tmbg,
	coldplay, nirvana, radiohead, metallica, whiteStripes, daftPunk
] = artists;

export const recommendations: UserRecommendations[] = [
	{
		userId: '0',
		items: [
			{ artist: tmbg, score: 6.808, reason: 'Because you listen to Betty Blowtorch' },
			{ artist: arctic, score: 6.791, reason: 'Because you listen to die Ärzte' },
			{ artist: misfits, score: 6.612, reason: 'Because you listen to Elvenking' },
			{ artist: nofx, score: 6.391, reason: 'Because you listen to die Ärzte' },
			{ artist: alkaline, score: 6.533, reason: 'Because you listen to Magica' },
			{ artist: strokes, score: 6.448, reason: 'Because you listen to Juliette & the Licks' },
			{ artist: redHot, score: 6.380, reason: 'Popular among similar listeners' },
			{ artist: nirvana, score: 6.291, reason: 'Because you listen to Melissa Etheridge' },
			{ artist: whiteStripes, score: 6.184, reason: 'Popular among similar listeners' },
			{ artist: metallica, score: 6.102, reason: 'Because you listen to The Black Dahlia Murder' }
		]
	},
	{
		userId: '1',
		items: [
			{ artist: daftPunk, score: 7.241, reason: 'Because you listen to Radiohead' },
			{ artist: metallica, score: 7.018, reason: 'Because you listen to Nirvana' },
			{ artist: misfits, score: 6.892, reason: 'Because you listen to The White Stripes' },
			{ artist: tmbg, score: 6.741, reason: 'Because you listen to Arctic Monkeys' },
			{ artist: betty, score: 6.610, reason: 'Popular among similar listeners' },
			{ artist: elvenking, score: 6.530, reason: 'Because you listen to Nirvana' },
			{ artist: alkaline, score: 6.480, reason: 'Popular among similar listeners' },
			{ artist: magica, score: 6.391, reason: 'Because you listen to Coldplay' },
			{ artist: melissa, score: 6.310, reason: 'Popular among similar listeners' },
			{ artist: juliette, score: 6.210, reason: 'Popular among similar listeners' }
		]
	},
	{
		userId: '2',
		items: [
			{ artist: arctic, score: 7.180, reason: 'Because you listen to Metallica' },
			{ artist: radiohead, score: 7.012, reason: 'Because you listen to Misfits' },
			{ artist: coldplay, score: 6.884, reason: 'Popular among similar listeners' },
			{ artist: strokes, score: 6.741, reason: 'Because you listen to NOFX' },
			{ artist: tmbg, score: 6.630, reason: 'Because you listen to Alkaline Trio' },
			{ artist: betty, score: 6.512, reason: 'Popular among similar listeners' },
			{ artist: juliette, score: 6.430, reason: 'Popular among similar listeners' },
			{ artist: daftPunk, score: 6.318, reason: 'Because you listen to Metallica' },
			{ artist: melissa, score: 6.240, reason: 'Popular among similar listeners' },
			{ artist: redHot, score: 6.160, reason: 'Popular among similar listeners' }
		]
	},
	{
		userId: '3',
		items: [
			{ artist: arctic, score: 7.380, reason: 'Because you listen to Coldplay' },
			{ artist: strokes, score: 7.210, reason: 'Because you listen to Arctic Monkeys' },
			{ artist: metallica, score: 7.041, reason: 'Because you listen to Nirvana' },
			{ artist: misfits, score: 6.912, reason: 'Popular among similar listeners' },
			{ artist: whiteStripes, score: 6.804, reason: 'Because you listen to The Strokes' },
			{ artist: betty, score: 6.690, reason: 'Popular among similar listeners' },
			{ artist: elvenking, score: 6.540, reason: 'Because you listen to Radiohead' },
			{ artist: nofx, score: 6.420, reason: 'Popular among similar listeners' },
			{ artist: alkaline, score: 6.310, reason: 'Popular among similar listeners' },
			{ artist: redHot, score: 6.210, reason: 'Because you listen to Arctic Monkeys' }
		]
	},
	{
		userId: '4',
		items: [
			{ artist: radiohead, score: 7.481, reason: 'Because you listen to Arctic Monkeys' },
			{ artist: daftPunk, score: 7.291, reason: 'Because you listen to Red Hot Chili Peppers' },
			{ artist: coldplay, score: 7.104, reason: 'Because you listen to Arctic Monkeys' },
			{ artist: tmbg, score: 6.931, reason: 'Popular among similar listeners' },
			{ artist: strokes, score: 6.812, reason: 'Because you listen to Red Hot Chili Peppers' },
			{ artist: alkaline, score: 6.701, reason: 'Because you listen to NOFX' },
			{ artist: elvenking, score: 6.594, reason: 'Because you listen to Metallica' },
			{ artist: blackDahlia, score: 6.480, reason: 'Because you listen to Metallica' },
			{ artist: betty, score: 6.371, reason: 'Popular among similar listeners' },
			{ artist: juliette, score: 6.260, reason: 'Popular among similar listeners' }
		]
	}
];

export function getRecommendationsForUser(userId: string): UserRecommendations | undefined {
	return recommendations.find((r) => r.userId === userId);
}
