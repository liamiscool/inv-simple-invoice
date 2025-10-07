import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return {
      clients: [],
      defaultTemplate: null
    };
  }
  
  // Get user's org_id first
  const { data: profile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single();
    
  if (!profile) {
    return {
      clients: [],
      defaultTemplate: null
    };
  }
  
  // Get clients for this org
  const { data: clients } = await supabase
    .from('client')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('name');
    
  // Get or create a default template (we'll need this for now)
  let { data: defaultTemplate } = await supabase
    .from('template')
    .select('*')
    .eq('kind', 'curated')
    .is('org_id', null)
    .limit(1)
    .single();
    
  // If no template exists, create a basic one
  if (!defaultTemplate) {
    const { data: newTemplate, error: templateError } = await supabase
      .from('template')
      .insert({
        title: 'Default Template',
        kind: 'curated',
        spec: {
          meta: { width: 210, height: 297, dpi: 300 },
          areas: {
            invoice_number: { x: 140, y: 20, type: 'text' },
            issue_date: { x: 140, y: 30, type: 'text' },
            client_info: { x: 20, y: 50, w: 80, h: 30, type: 'multiline' },
            items_table: { 
              start: { x: 20, y: 100 },
              columns: [
                { key: 'description', w: 100 },
                { key: 'qty', w: 20 },
                { key: 'unit_price', w: 25 },
                { key: 'line_total', w: 25 }
              ],
              row_height: 8
            },
            totals: { x: 140, y: 200, w: 50, h: 30, type: 'totals' }
          }
        }
      })
      .select()
      .single();
      
    if (templateError) {
      console.error('Failed to create default template:', templateError);
    } else {
      defaultTemplate = newTemplate;
    }
  }
  
  return {
    clients: clients || [],
    defaultTemplate
  };
};