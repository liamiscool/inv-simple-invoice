import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
  const { supabase } = await parent();

  return {
    supabase,
    url
  };
};
