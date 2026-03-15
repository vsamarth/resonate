import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				base: {
					DEFAULT: '#000000',
					card: '#1C1C1E',
					surface: '#2C2C2E',
					elevated: '#3A3A3C'
				},
				accent: {
					DEFAULT: '#FC3C44',
					hover: '#FF5C63'
				},
				text: {
					primary: '#FFFFFF',
					secondary: 'rgba(235,235,245,0.6)',
					tertiary: 'rgba(235,235,245,0.3)'
				}
			},
			fontFamily: {
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'"SF Pro Display"',
					'"SF Pro Text"',
					'"Helvetica Neue"',
					'Arial',
					'sans-serif'
				]
			},
			borderRadius: {
				card: '12px',
				hero: '16px'
			}
		}
	},
	plugins: []
} satisfies Config;
