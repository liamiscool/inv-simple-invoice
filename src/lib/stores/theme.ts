import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
	// Initialize from localStorage or default to 'system'
	const stored = browser ? (localStorage.getItem('theme') as Theme) : 'system';
	const { subscribe, set } = writable<Theme>(stored || 'system');

	return {
		subscribe,
		set: (theme: Theme) => {
			if (browser) {
				localStorage.setItem('theme', theme);

				// Update DOM class
				if (theme === 'dark') {
					document.documentElement.classList.add('dark');
				} else if (theme === 'light') {
					document.documentElement.classList.remove('dark');
				} else {
					// System preference
					const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
					if (prefersDark) {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
				}
			}
			set(theme);
		},
		toggle: () => {
			// Cycle through: light → dark → system → light
			const current = browser ? (localStorage.getItem('theme') as Theme) : 'light';
			const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
			createThemeStore().set(next);
		}
	};
}

export const theme = createThemeStore();
