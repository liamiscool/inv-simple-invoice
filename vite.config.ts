import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// Exclude standard puppeteer from SSR bundle (for Cloudflare Workers)
		// We use @cloudflare/puppeteer in production and local puppeteer in development
		external: ['puppeteer']
	}
});
