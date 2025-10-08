import { env } from '$env/dynamic/public';

// Stripe Payment Links
// TODO: Replace these with your actual Stripe payment links after creating them
export const STRIPE_MONTHLY_LINK = env.PUBLIC_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/test_REPLACE_ME';
export const STRIPE_YEARLY_LINK = env.PUBLIC_STRIPE_YEARLY_LINK || 'https://buy.stripe.com/test_REPLACE_ME';

// Plan details
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    clientLimit: 3,
    features: [
      '3 clients maximum',
      'Unlimited invoices',
      'Basic templates',
      'Email sending'
    ]
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 10,
    yearlyPrice: 96,
    clientLimit: Infinity,
    features: [
      'Unlimited clients',
      'Unlimited invoices',
      'Custom template uploads',
      'All basic templates',
      'Priority support'
    ]
  }
} as const;
