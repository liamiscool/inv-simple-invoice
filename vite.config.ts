import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// Exclude Puppeteer from SSR build (not compatible with Cloudflare Workers)
		external: ['puppeteer', 'puppeteer-core', '@puppeteer/browsers']
	}
});
