import { error as svelteError } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
  const { supabase } = await parent();

  const { data: client, error } = await supabase
    .from('client')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !client) {
    console.error('Client load error:', error);
    throw svelteError(404, 'Client not found');
  }

  return {
    supabase,
    client
  };
};
