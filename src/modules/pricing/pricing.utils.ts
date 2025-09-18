import Stripe from 'stripe';
import { PlanType, BillingCycle, Plan } from './pricing.types';

export const STRIPE_PLANS: Record<PlanType, Record<BillingCycle, Omit<Plan, 'id' | 'stripePriceId'>>> = {
  [PlanType.STARTER]: {
    [BillingCycle.MONTHLY]: {
      name: 'Starter',
      type: PlanType.STARTER,
      price: 0,
      billingCycle: BillingCycle.MONTHLY,
      currency: 'usd',
      description: 'Perfect for individuals and small teams getting started',
      features: [
        'Up to 3 users',
        'Basic incident management',
        'Email notifications',
        'Community support'
      ]
    },
    [BillingCycle.YEARLY]: {
      name: 'Starter',
      type: PlanType.STARTER,
      price: 0,
      billingCycle: BillingCycle.YEARLY,
      currency: 'usd',
      description: 'Perfect for individuals and small teams getting started',
      features: [
        'Up to 3 users',
        'Basic incident management',
        'Email notifications',
        'Community support'
      ]
    }
  },
  [PlanType.GROWTH]: {
    [BillingCycle.MONTHLY]: {
      name: 'Growth',
      type: PlanType.GROWTH,
      price: 9,
      billingCycle: BillingCycle.MONTHLY,
      currency: 'usd',
      description: 'For growing teams that need more power',
      features: [
        'Up to 20 users',
        'Advanced incident management',
        'Email & Slack notifications',
        'Priority support',
        'Basic analytics'
      ]
    },
    [BillingCycle.YEARLY]: {
      name: 'Growth',
      type: PlanType.GROWTH,
      price: 90,
      billingCycle: BillingCycle.YEARLY,
      currency: 'usd',
      description: 'For growing teams that need more power',
      features: [
        'Up to 20 users',
        'Advanced incident management',
        'Email & Slack notifications',
        'Priority support',
        'Basic analytics'
      ]
    }
  },
  [PlanType.PRO]: {
    [BillingCycle.MONTHLY]: {
      name: 'Pro',
      type: PlanType.PRO,
      price: 19,
      billingCycle: BillingCycle.MONTHLY,
      currency: 'usd',
      description: 'For businesses that need advanced features',
      features: [
        'Unlimited users',
        'Advanced incident management',
        'All notification channels',
        '24/7 dedicated support',
        'Advanced analytics & reporting',
        'API access'
      ]
    },
    [BillingCycle.YEARLY]: {
      name: 'Pro',
      type: PlanType.PRO,
      price: 190,
      billingCycle: BillingCycle.YEARLY,
      currency: 'usd',
      description: 'For businesses that need advanced features',
      features: [
        'Unlimited users',
        'Advanced incident management',
        'All notification channels',
        '24/7 dedicated support',
        'Advanced analytics & reporting',
        'API access'
      ]
    }
  },
  [PlanType.ENTERPRISE]: {
    [BillingCycle.MONTHLY]: {
      name: 'Enterprise',
      type: PlanType.ENTERPRISE,
      price: 9,
      billingCycle: BillingCycle.MONTHLY,
      currency: 'usd',
      description: 'Custom solution for large organizations',
      features: [
        'Unlimited users',
        'Everything in Pro',
        'Custom integrations',
        'Dedicated account manager',
        'Custom SLA',
        'On-premise deployment option'
      ]
    },
    [BillingCycle.YEARLY]: {
      name: 'Enterprise',
      type: PlanType.ENTERPRISE,
      price: 90,
      billingCycle: BillingCycle.YEARLY,
      currency: 'usd',
      description: 'Custom solution for large organizations',
      features: [
        'Unlimited users',
        'Everything in Pro',
        'Custom integrations',
        'Dedicated account manager',
        'Custom SLA',
        'On-premise deployment option'
      ]
    }
  }
};

export function getPlanByTypeAndCycle(planType: PlanType, billingCycle: BillingCycle): Omit<Plan, 'id' | 'stripePriceId'> {
  return STRIPE_PLANS[planType][billingCycle];
}

export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'usd',
  }).format(amount);
}

export function calculateProratedAmount(
  currentPlan: Plan,
  newPlan: Plan,
  daysRemaining: number,
  daysInMonth: number
): number {
  const currentDailyRate = currentPlan.price / daysInMonth;
  const newDailyRate = newPlan.price / daysInMonth;
  
  const currentProrated = currentDailyRate * daysRemaining;
  const newProrated = newDailyRate * daysRemaining;
  
  return newProrated - currentProrated;
}

export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  try {
    stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return true;
  } catch (err:any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return false;
  }
}

export function handleStripeError(error: Stripe.StripeRawError): { message: string; code: string; statusCode: number } {
  return {
    message: error.message || 'An unexpected error occurred with Stripe',
    code: error.code || 'stripe_error',
    statusCode: error.statusCode || 500
  };
}