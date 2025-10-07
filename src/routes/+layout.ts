import { createClient } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  depends('supabase:auth');

  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    session,
    user: data.user,
    supabase,
  };
};