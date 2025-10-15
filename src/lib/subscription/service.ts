import type { SupabaseClient } from '@supabase/supabase-js';

export type PlanType = 'free' | 'pro';

export interface SubscriptionInfo {
  plan: PlanType;
  status: string;
  clientCount: number;
  clientLimit: number;
  canAddClients: boolean;
  canUploadTemplates: boolean;
}

const FREE_CLIENT_LIMIT = 3;

/**
 * Get subscription info for the current user's org
 */
export async function getSubscriptionInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionInfo | null> {
  try {
    // Get user's org_id
    const { data: profile } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', userId)
      .single();

    if (!profile) {
      return null;
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from('plan_subscription')
      .select('plan, status')
      .eq('org_id', profile.org_id)
      .maybeSingle();

    // Count all clients (hard delete means no soft deletion)
    const { count: clientCount } = await supabase
      .from('client')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', profile.org_id);

    const plan = subscription?.plan || 'free';
    const activeClientCount = clientCount || 0;
    const isPro = plan === 'pro' && subscription?.status === 'active';

    return {
      plan,
      status: subscription?.status || 'active',
      clientCount: activeClientCount,
      clientLimit: isPro ? Infinity : FREE_CLIENT_LIMIT,
      canAddClients: isPro || activeClientCount < FREE_CLIENT_LIMIT,
      canUploadTemplates: isPro
    };

  } catch (error) {
    console.error('Error getting subscription info:', error);
    return null;
  }
}

/**
 * Check if user can add a new client
 */
export async function canAddClient(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const info = await getSubscriptionInfo(supabase, userId);
  return info?.canAddClients || false;
}

/**
 * Check if user can upload custom templates
 */
export async function canUploadTemplate(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const info = await getSubscriptionInfo(supabase, userId);
  return info?.canUploadTemplates || false;
}

/**
 * Check if user has pro plan
 */
export async function hasPro(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const info = await getSubscriptionInfo(supabase, userId);
  return info?.plan === 'pro' && info.status === 'active';
}
