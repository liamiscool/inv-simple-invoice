import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/public';

export const GET: RequestHandler = async ({ platform }) => {
  try {
    const platformEnv = platform?.env;

    return json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: {
        // Check both platform.env (Cloudflare) and SvelteKit env
        hasSupabaseUrl: !!(platformEnv?.PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL),
        hasSupabaseAnonKey: !!(platformEnv?.PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_ANON_KEY),
        hasSiteUrl: !!(platformEnv?.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL),
        hasPlatform: !!platform,
        hasPlatformEnv: !!platformEnv,
        supabaseUrlPrefix: (platformEnv?.PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL)?.substring(0, 20) || 'missing'
      }
    });
  } catch (error) {
    return json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
