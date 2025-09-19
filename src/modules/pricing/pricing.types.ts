import { Interval } from '@prisma/client';

export enum PlanType {
  STARTER = 'starter',
  GROWTH = 'growth',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export enum BillingCycle {
  MONTHLY = 'month',
  YEARLY = 'year'
}

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  billingCycle: BillingCycle;
  currency: string;
  description: string;
  features: Record<string,string>[];
  stripePriceId: string;
  metadata?: Record<string, any>;
  pricingDuration?:string;
  isPopular:  boolean;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  quantity: number;
  trialEnd?: Date;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionRequest {
  planType: PlanType;
  billingCycle: BillingCycle;
  quantity: number;
  paymentMethodId: string;
  customerId?: string;
  trialDays?: number;
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string;
  planType: PlanType;
  billingCycle: BillingCycle;
  quantity: number;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface CancelSubscriptionRequest {
  subscriptionId: string;
  immediate?: boolean;
}

// Renamed from Customer to CustomerData to avoid conflicts
export interface CustomerData {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  hostedInvoiceUrl?: string;
  pdfUrl?: string;
  createdAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'sepa_debit' | 'ideal' | 'bancontact' | 'sofort' | 'giropay' | 'eps';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface PortalSessionRequest {
  customerId: string;
  returnUrl: string;
}

export interface PortalSessionResponse {
  url: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  apiVersion: string;
  created: number;
}

export interface PricingServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  statusCode: number;
}