import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Database } from './types/database.types';

export const createClient = () =>
  isBrowser()
    ? createBrowserClient<Database>(env.PUBLIC_SUPABASE_URL!, env.PUBLIC_SUPABASE_ANON_KEY!)
    : createServerClient<Database>(env.PUBLIC_SUPABASE_URL!, env.PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      });