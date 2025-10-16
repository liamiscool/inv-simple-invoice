import { fail } from '@sveltejs/kit';

import type {
  Actions,
  PageServerLoad,
} from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    return {
      profile: null,
      subscription: null,
      customFields: []
    };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single() as { data: any | null };

  // Get subscription info
  const { data: subscription } = await supabase
    .from('plan_subscription')
    .select('plan, status')
    .eq('org_id', profile?.org_id)
    .maybeSingle() as { data: any | null };

  // Get custom fields for this org
  let customFields = [];
  if (profile?.org_id) {
    const { data } = await supabase
      .from('custom_field')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false }) as { data: any[] | null };

    customFields = data || [];
  }

  return {
    profile,
    subscription,
    customFields
  };
};

export const actions = {
  createCustomField: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const fieldLabel = formData.get('field_label') as string;

    if (!fieldLabel || !fieldLabel.trim()) {
      return fail(400, { error: 'Field label is required' });
    }

    // Get user's org_id
    const { data: userProfile } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', user.id)
      .single() as { data: { org_id: string } | null };

    if (!userProfile?.org_id) {
      return fail(400, { error: 'Organization not found' });
    }

    // Generate field_name from label
    const fieldName = 'custom_' + fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Create custom field
    const { error } = await supabase
      .from('custom_field')
      .insert({
        org_id: userProfile.org_id,
        field_name: fieldName,
        field_label: fieldLabel,
        field_type: 'text'
      } as any);

    if (error) {
      console.error('Error creating custom field:', error);
      return fail(500, { error: `Failed to create custom field: ${error.message}` });
    }

    return { success: true, message: 'Custom field created successfully' };
  },

  deleteCustomField: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const fieldId = formData.get('field_id') as string;

    if (!fieldId) {
      return fail(400, { error: 'Field ID is required' });
    }

    // Get user's org_id
    const { data: userProfile } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', user.id)
      .single() as { data: { org_id: string } | null };

    if (!userProfile?.org_id) {
      return fail(400, { error: 'Organization not found' });
    }

    // Delete custom field (only if it belongs to user's org)
    const { error } = await supabase
      .from('custom_field')
      .delete()
      .eq('id', fieldId)
      .eq('org_id', userProfile.org_id);

    if (error) {
      console.error('Error deleting custom field:', error);
      return fail(500, { error: `Failed to delete custom field: ${error.message}` });
    }

    return { success: true, message: 'Custom field deleted successfully' };
  }
} satisfies Actions;