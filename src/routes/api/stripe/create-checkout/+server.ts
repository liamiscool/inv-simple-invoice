import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover'
}) : null;

// Your Stripe Price IDs (get these from Stripe dashboard)
const PRICE_IDS = {
  monthly: env.STRIPE_MONTHLY_PRICE_ID || 'price_1SFyLIPXdhaYibyfOUNmGaBN',
  yearly: env.STRIPE_YEARLY_PRICE_ID || 'price_1SFyLjPXdhaYibyfLY4ekFSD'
};

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession }, url }) => {
  if (!stripe) {
    return json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const { user } = await safeGetSession();
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { priceType } = await request.json();

    if (!priceType || !['monthly', 'yearly'].includes(priceType)) {
      return json({ error: 'Invalid price type' }, { status: 400 });
    }

    // Get user's org_id
    const { data: profile, error: profileError } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', user.id)
      .maybeSingle() as { data: { org_id: string } | null; error: any };

    if (profileError || !profile?.org_id) {
      return json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: PRICE_IDS[priceType as 'monthly' | 'yearly'],
          quantity: 1
        }
      ],
      success_url: `${url.origin}/app/settings?upgraded=true`,
      cancel_url: `${url.origin}/app/settings?upgrade_cancelled=true`,
      customer_email: user.email,
      subscription_data: {
        metadata: {
          org_id: profile.org_id as string,
          user_id: user.id
        }
      },
      metadata: {
        org_id: profile.org_id as string,
        user_id: user.id
      }
    });

    return json({ url: session.url });

  } catch (error) {
    console.error('Checkout session error:', error);
    return json({
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    }, { status: 500 });
  }
};
