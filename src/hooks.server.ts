import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { sequence } from '@sveltejs/kit/hooks';

const supabase: Handle = async ({ event, resolve }) => {
  // Get environment variables - Cloudflare Pages uses event.platform.env
  const supabaseUrl = event.platform?.env?.PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = event.platform?.env?.PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_ANON_KEY;

  // Check for required environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      platform: !!event.platform,
      platformEnv: !!event.platform?.env
    });
    throw new Error('Supabase configuration is missing. Please check environment variables.');
  }

  event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      },
    },
  });

  event.locals.safeGetSession = async () => {
    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();
    if (error) {
      return { session: null, user: null };
    }

    return { session: null, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};

const authGuard: Handle = async ({ event, resolve }) => {
  const { user } = await event.locals.safeGetSession();
  
  // Protected routes
  if (event.url.pathname.startsWith('/app')) {
    if (!user) {
      redirect(303, '/auth/login');
    }
  }
  
  // Redirect authenticated users away from auth pages
  if (event.url.pathname.startsWith('/auth') && user) {
    redirect(303, '/app');
  }

  return resolve(event);
};

export const handle = sequence(supabase, authGuard);