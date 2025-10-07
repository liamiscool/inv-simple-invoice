import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
  const { session, supabase } = await parent();
  
  return {
    session,
    supabase,
  };
};