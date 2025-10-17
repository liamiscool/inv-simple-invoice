// Cloudflare Pages Functions middleware
// This file configures compatibility flags for the entire Functions runtime

export const onRequest: PagesFunction = async (context) => {
  return await context.next();
};

// Export configuration for Cloudflare Pages
export const config = {
  // Enable Node.js compatibility for SvelteKit and @cloudflare/puppeteer
  nodejs_compat: true,
};
