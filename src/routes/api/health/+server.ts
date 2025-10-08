import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/public';

export const GET: RequestHandler = async () => {
  try {
    return json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: {
        hasSupabaseUrl: !!env.PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!env.PUBLIC_SUPABASE_ANON_KEY,
        hasSiteUrl: !!env.PUBLIC_SITE_URL,
        supabaseUrlPrefix: env.PUBLIC_SUPABASE_URL?.substring(0, 20) || 'missing'
      }
    });
  } catch (error) {
    return json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
