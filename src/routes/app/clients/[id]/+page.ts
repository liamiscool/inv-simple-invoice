import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
  const { supabase } = await parent();

  const { data: client, error } = await supabase
    .from('client')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    throw new Error('Client not found');
  }

  return {
    client
  };
};
