import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover'
}) : null;

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  if (!stripe || !webhookSecret) {
    console.error('Stripe not configured');
    return json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        // Subscription is already handled by subscription.updated event
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any; // Stripe.Invoice has subscription as string | Subscription | null
        if (invoice.subscription) {
          await updateSubscriptionStatus(supabase, invoice.subscription as string, 'past_due');
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return json({
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }, { status: 500 });
  }
};

// Handle completed checkout session
async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error('Missing customer or subscription in checkout session');
    return;
  }

  // Get the subscription to get org_id from metadata
  if (!stripe) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const orgId = subscription.metadata.org_id;

  if (!orgId) {
    console.error('No org_id in subscription metadata');
    return;
  }

  // Update or create subscription record
  const sub: any = subscription; // Type assertion for period timestamps
  const { error } = await supabase
    .from('plan_subscription')
    .upsert({
      org_id: orgId,
      plan: 'pro',
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'org_id'
    });

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log('Subscription created/updated for org:', orgId);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const orgId = subscription.metadata.org_id;

  if (!orgId) {
    console.error('No org_id in subscription metadata');
    return;
  }

  const status = subscription.status === 'active' ? 'active' :
                 subscription.status === 'canceled' ? 'canceled' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'trialing' ? 'trialing' : 'active';

  const sub: any = subscription; // Type assertion for period timestamps
  const { error } = await supabase
    .from('plan_subscription')
    .upsert({
      org_id: orgId,
      plan: 'pro',
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'org_id'
    });

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log('Subscription updated for org:', orgId);
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.org_id;

  if (!orgId) {
    console.error('No org_id in subscription metadata');
    return;
  }

  // Downgrade to free plan
  const { error } = await supabase
    .from('plan_subscription')
    .update({
      plan: 'free',
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId);

  if (error) {
    console.error('Error downgrading subscription:', error);
  } else {
    console.log('Subscription canceled, downgraded to free for org:', orgId);
  }
}

// Update subscription status
async function updateSubscriptionStatus(supabase: any, subscriptionId: string, status: string) {
  const { error } = await supabase
    .from('plan_subscription')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription status:', error);
  }
}
