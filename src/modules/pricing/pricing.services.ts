import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { 
  PlanType, 
  BillingCycle, 
  Plan, 
  Subscription, 
  CustomerData, // Use CustomerData instead of Customer
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  PortalSessionRequest,
  PortalSessionResponse,
  PricingServiceResponse,
  Invoice,
  PaymentMethod
} from './pricing.types';
import { 
  getPlanByTypeAndCycle, 
  formatAmount, 
  calculateProratedAmount, 
  validateWebhookSignature,
  handleStripeError
} from './pricing.utils';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export class PricingService {
  // Get all available plans
  async getPlans(): Promise<PricingServiceResponse<Plan[]>> {
    try {
      const plans: Plan[] = [];
      
      for (const planType of Object.values(PlanType)) {
        for (const billingCycle of Object.values(BillingCycle)) {
          const planData = getPlanByTypeAndCycle(planType, billingCycle);
          
          // Get Stripe price ID for this plan
          const stripePrice = await this.getOrCreateStripePrice(planType, billingCycle);
          
          plans.push({
            id: `${planType}-${billingCycle}`,
            ...planData,
            stripePriceId: stripePrice.id
          });
        }
      }
      
      return {
        success: true,
        data: plans,
        statusCode: 200
      };
    } catch (error) {
      const stripeError = handleStripeError(error as any);
      return {
        success: false,
        error: stripeError,
        statusCode: stripeError.statusCode
      };
    }
  }

  // Get or create Stripe price for a plan
  private async getOrCreateStripePrice(planType: PlanType, billingCycle: BillingCycle): Promise<Stripe.Price> {
    const plan = getPlanByTypeAndCycle(planType, billingCycle);
    const productName = `${plan.name} (${billingCycle})`;
    
    // Find existing product
    let product = await stripe.products.list({
      active: true,
      limit: 100
    }).then(res => res.data.find(p => p.name === productName));
    
    // Create product if it doesn't exist
    if (!product) {
      product = await stripe.products.create({
        name: productName,
        description: plan.description,
        metadata: {
          planType,
          billingCycle
        }
      });
    }
    
    // Find existing price
    let price = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100
    }).then(res => res.data.find(p => 
      p.unit_amount === plan.price * 100 && 
      p.recurring?.interval === billingCycle
    ));
    
    // Create price if it doesn't exist
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price * 100, // Stripe uses cents
        currency: plan.currency,
        recurring: {
          interval: billingCycle
        },
        metadata: {
          planType,
          billingCycle
        }
      });
    }
    
    return price;
  }

  // Create or retrieve Stripe customer
  async getOrCreateStripeCustomer(userEmail: string, userName?: string): Promise<Stripe.Customer> {
    // Check if customer already exists in our DB
    const dbCustomer = await prisma.customer.findUnique({
      where: { contactEmail: userEmail }
    });
    
    if (dbCustomer?.stripeCustomerId) {
      return await stripe.customers.retrieve(dbCustomer.stripeCustomerId) as Stripe.Customer;
    }
    
    // Create new customer in Stripe
    const stripeCustomer = await stripe.customers.create({
      email: userEmail,
      name: userName,
      metadata: {
        source: 'app_signup'
      }
    });
    
    // Save customer to our DB
    if (dbCustomer) {
      await prisma.customer.update({
        where: { id: dbCustomer.id },
        data: { stripeCustomerId: stripeCustomer.id }
      });
    } else {
      await prisma.customer.create({
        data: {
          name: userName || '',
          contactEmail: userEmail,
          tenantId: stripeCustomer.id, // Using Stripe customer ID as tenant ID
          stripeCustomerId: stripeCustomer.id
        }
      });
    }
    
    return stripeCustomer;
  }

  // Create a new subscription
  async createSubscription(
    userEmail: string,
    userName: string,
    request: CreateSubscriptionRequest
  ): Promise<PricingServiceResponse<Subscription>> {
    try {
      // Get or create Stripe customer
      const customer = await this.getOrCreateStripeCustomer(userEmail, userName);
      
      // Get plan details
      const plan = getPlanByTypeAndCycle(request.planType, request.billingCycle);
      const stripePrice = await this.getOrCreateStripePrice(request.planType, request.billingCycle);
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(request.paymentMethodId, {
        customer: customer.id
      });
      
      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: request.paymentMethodId
        }
      });
      
      // Create subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{
          price: stripePrice.id,
          quantity: request.quantity
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planType: request.planType,
          billingCycle: request.billingCycle
        }
      };
      
      // Add trial if specified
      if (request.trialDays && request.trialDays > 0) {
        subscriptionParams.trial_period_days = request.trialDays;
      }
      
      const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);
      
      // Save subscription to our DB
      const dbSubscription = await prisma.subscription.create({
        data: {
          customerId: customer.id,
          planId: `${request.planType}-${request.billingCycle}`,
          status: stripeSubscription.status.toUpperCase() as any, // Convert to uppercase for Prisma enum
          currentPeriodStart: new Date(stripeSubscription.start_date * 1000),
          currentPeriodEnd: new Date(Number(stripeSubscription?.ended_at) * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          quantity: request.quantity,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
          metadata: {
            stripeSubscriptionId: stripeSubscription.id,
            planType: request.planType,
            billingCycle: request.billingCycle
          }
        }
      });
      
      // Map to our Subscription type
      const subscription: Subscription = {
        id: dbSubscription.id,
        customerId: dbSubscription.customerId,
        planId: dbSubscription.planId,
        status: dbSubscription.status as any,
        currentPeriodStart: dbSubscription.currentPeriodStart,
        currentPeriodEnd: dbSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: dbSubscription.cancelAtPeriodEnd,
        quantity: dbSubscription.quantity,
        trialEnd: dbSubscription.trialEnd || undefined,
        metadata: dbSubscription.metadata as any
      };
      
      return {
        success: true,
        data: subscription,
        statusCode: 200
      };
    } catch (error) {
      const stripeError = handleStripeError(error as any);
      return {
        success: false,
        error: stripeError,
        statusCode: stripeError.statusCode
      };
    }
  }

  // Update an existing subscription
  async updateSubscription(
    request: UpdateSubscriptionRequest
  ): Promise<PricingServiceResponse<Subscription>> {
    try {
      // Get subscription from our DB
      const dbSubscription = await prisma.subscription.findUnique({
        where: { id: request.subscriptionId }
      });
      
      if (!dbSubscription) {
        return {
          success: false,
          error: {
            message: 'Subscription not found',
            code: 'subscription_not_found'
          },
          statusCode: 404
        };
      }
      
      // Get Stripe subscription
      const stripeSubscriptionId = (dbSubscription.metadata as any)?.stripeSubscriptionId as string;
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      
      // Get new plan details
      const plan = getPlanByTypeAndCycle(request.planType, request.billingCycle);
      const stripePrice = await this.getOrCreateStripePrice(request.planType, request.billingCycle);
      
      // Find subscription item for the plan
      const subscriptionItem = stripeSubscription.items.data[0];
      
      // Update subscription
      const updatedSubscription = await stripe.subscriptions.update(
        stripeSubscription.id,
        {
          items: [{
            id: subscriptionItem.id,
            price: stripePrice.id,
            quantity: request.quantity
          }],
          proration_behavior: request.prorationBehavior || 'create_prorations',
          metadata: {
            planType: request.planType,
            billingCycle: request.billingCycle
          }
        }
      );
      
      // Update subscription in our DB
      const updatedDbSubscription = await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          planId: `${request.planType}-${request.billingCycle}`,
          status: updatedSubscription.status.toUpperCase() as any, // Convert to uppercase for Prisma enum
          currentPeriodStart: new Date(updatedSubscription.start_date * 1000),
          currentPeriodEnd: new Date(Number(updatedSubscription.ended_at) * 1000),
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          quantity: request.quantity,
          metadata: {
            ...(typeof dbSubscription.metadata === 'object' ? dbSubscription.metadata : {}),
            planType: request.planType,
            billingCycle: request.billingCycle
          }
        }
      });
      
      // Map to our Subscription type
      const subscription: Subscription = {
        id: updatedDbSubscription.id,
        customerId: updatedDbSubscription.customerId,
        planId: updatedDbSubscription.planId,
        status: updatedDbSubscription.status as any,
        currentPeriodStart: updatedDbSubscription.currentPeriodStart,
        currentPeriodEnd: updatedDbSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: updatedDbSubscription.cancelAtPeriodEnd,
        quantity: updatedDbSubscription.quantity,
        trialEnd: updatedDbSubscription.trialEnd || undefined,
        metadata: updatedDbSubscription.metadata as any
      };
      
      return {
        success: true,
        data: subscription,
        statusCode: 200
      };
    } catch (error) {
      const stripeError = handleStripeError(error as any);
      return {
        success: false,
        error: stripeError,
        statusCode: stripeError.statusCode
      };
    }
  }

  // Cancel a subscription
  async cancelSubscription(
    request: CancelSubscriptionRequest
  ): Promise<PricingServiceResponse<Subscription>> {
    try {
      // Get subscription from our DB
      const dbSubscription = await prisma.subscription.findUnique({
        where: { id: request.subscriptionId }
      });
      
      if (!dbSubscription) {
        return {
          success: false,
          error: {
            message: 'Subscription not found',
            code: 'subscription_not_found'
          },
          statusCode: 404
        };
      }
      
      // Get Stripe subscription
      const stripeSubscriptionId = (dbSubscription.metadata as any)?.stripeSubscriptionId as string;
      
      // Cancel subscription
      let canceledSubscription: Stripe.Subscription;
      
      if (request.immediate) {
        canceledSubscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
      } else {
        canceledSubscription = await stripe.subscriptions.update(
          stripeSubscriptionId,
          {
            cancel_at_period_end: true
          }
        );
      }
      
      // Update subscription in our DB
      const updatedDbSubscription = await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: 'CANCELED' as any, // Use uppercase to match Prisma enum
          cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
          metadata: {
            ...(typeof dbSubscription.metadata === 'object' ? dbSubscription.metadata : {}),
            canceledAt: new Date().toISOString()
          }
        }
      });
      
      // Map to our Subscription type
      const subscription: Subscription = {
        id: updatedDbSubscription.id,
        customerId: updatedDbSubscription.customerId,
        planId: updatedDbSubscription.planId,
        status: updatedDbSubscription.status as any,
        currentPeriodStart: updatedDbSubscription.currentPeriodStart,
        currentPeriodEnd: updatedDbSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: updatedDbSubscription.cancelAtPeriodEnd,
        quantity: updatedDbSubscription.quantity,
        trialEnd: updatedDbSubscription.trialEnd || undefined,
        metadata: updatedDbSubscription.metadata as any
      };
      
      return {
        success: true,
        data: subscription,
        statusCode: 200
      };
    } catch (error) {
      const stripeError = handleStripeError(error as any);
      return {
        success: false,
        error: stripeError,
        statusCode: stripeError.statusCode
      };
    }
  }

  // Get customer subscriptions
  async getCustomerSubscriptions(customerId: string): Promise<PricingServiceResponse<Subscription[]>> {
    try {
      // Get customer from our DB
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer) {
        return {
          success: false,
          error: {
            message: 'Customer not found',
            code: 'customer_not_found'
          },
          statusCode: 404
        };
      }
      
      // Get subscriptions from our DB
      const dbSubscriptions = await prisma.subscription.findMany({
        where: { customerId: customer.id }
      });
      
      // Map to our Subscription type
      const subscriptions: Subscription[] = dbSubscriptions.map(sub => ({
        id: sub.id,
        customerId: sub.customerId,
        planId: sub.planId,
        status: sub.status as any,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        quantity: sub.quantity,
        trialEnd: sub.trialEnd || undefined,
        metadata: sub.metadata as any
      }));
      
      return {
        success: true,
        data: subscriptions,
        statusCode: 200
      };
    } catch (error) {
      const stripeError = handleStripeError(error as any);
      return {
        success: false,
        error: stripeError,
        statusCode: stripeError.statusCode
      };
    }
  }

  // Create customer portal session
  async createPortalSession(
    request: PortalSessionRequest
  ): Promise<PricingServiceResponse<PortalSessionResponse>> {
    try {
      // Get customer from our DB
      const customer = await prisma.customer.findUnique({
        where: { id: request.customerId }
      });
      
      if (!customer?.stripeCustomerId) {
        return {
          success: false,
          error: {
            message: 'Customer not found or has no Stripe customer ID',
            code: 'customer_not_found'
          },
          statusCode: 404
        };
      }
      
      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: request.returnUrl
      });
      
      return {
        success: true,
        data: { url: session.url },
        statusCode: 200
      };
    } catch (error) {
      const stripeError = handleStripeError(error as any);
      return {
        success: false,
        error: stripeError,
        statusCode: stripeError.statusCode
      };
    }
  }

  // Get customer invoices
  async getCustomerInvoices(customerId: string): Promise<PricingServiceResponse<Invoice[]>> {
    try {
      // Get customer from our DB
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer?.stripeCustomerId) {
        return {
          success: false,
          error: {
            message: 'Customer not found or has no Stripe customer ID',
            code: 'customer_not_found'
          },
          statusCode: 404
        };
      }
      
      // Get invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: customer.stripeCustomerId,
        limit: 100
      });
      
      // Map to our Invoice type
      const mappedInvoices: Invoice[] = invoices.data
        .filter(invoice => invoice.id) // Ensure invoice has an ID
        .map(invoice => ({
          id: invoice.id || '',
          customerId: invoice.customer as string,
          subscriptionId: (invoice as any).subscription as string || '',
          amount: invoice.total / 100, // Convert from cents
          currency: invoice.currency,
          status: invoice.status as any,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          pdfUrl: invoice.invoice_pdf || undefined,
          createdAt: new Date(invoice.created * 1000)
        }));
      
      return {
        success: true,
        data: mappedInvoices,
        statusCode: 200
      };
    } catch (error) {
      const stripeError = handleStripeError(error as any);
      return {
        success: false,
        error: stripeError,
        statusCode: stripeError.statusCode
      };
    }
  }

  // Get customer payment methods
  async getCustomerPaymentMethods(customerId: string): Promise<PricingServiceResponse<PaymentMethod[]>> {
    try {
      // Get customer from our DB
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer?.stripeCustomerId) {
        return {
          success: false,
          error: {
            message: 'Customer not found or has no Stripe customer ID',
            code: 'customer_not_found'
          },
          statusCode: 404
        };
      }
      
      // Get payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.stripeCustomerId,
        type: 'card',
        limit: 100
      });
      
      // Get default payment method
      const stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId) as Stripe.Customer;
      const defaultPaymentMethodId = stripeCustomer.invoice_settings?.default_payment_method as string;
      
      // Map to our PaymentMethod type
      const mappedPaymentMethods: PaymentMethod[] = paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type as any,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId
      }));
      
      return {
        success: true,
        data: mappedPaymentMethods,
        statusCode: 200
      };
    } catch (error) {
      const stripeError = handleStripeError(error as any);
      return {
        success: false,
        error: stripeError,
        statusCode: stripeError.statusCode
      };
    }
  }

  // Handle Stripe webhooks
  async handleWebhook(event: any): Promise<PricingServiceResponse<void>> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.updated':
          await this.handleCustomerUpdated(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      return {
        success: true,
        statusCode: 200
      };
    } catch (error) {
      console.error('Webhook handling error:', error);
      return {
        success: false,
        error: {
          message: 'Webhook handling failed',
          details: error
        },
        statusCode: 500
      };
    }
  }

  // Handle subscription updated webhook
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Find subscription in our DB
    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        metadata: {
          path: ['stripeSubscriptionId'],
          equals: subscription.id
        }
      }
    });
    
    if (dbSubscription) {
      // Get current metadata
      const currentMetadata = typeof dbSubscription.metadata === 'object' ? dbSubscription.metadata : {};
      
      // Update subscription in our DB
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: subscription.status.toUpperCase() as any, // Convert to uppercase for Prisma enum
          currentPeriodStart: new Date(subscription.start_date * 1000),
          currentPeriodEnd: new Date(Number(subscription.ended_at) * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          quantity: subscription.items.data[0].quantity,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          metadata: {
            ...currentMetadata,
            ...subscription.metadata
          }
        }
      });
    }
  }

  // Handle subscription deleted webhook
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Find subscription in our DB
    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        metadata: {
          path: ['stripeSubscriptionId'],
          equals: subscription.id
        }
      }
    });
    
    if (dbSubscription) {
      // Get current metadata
      const currentMetadata = typeof dbSubscription.metadata === 'object' ? dbSubscription.metadata : {};
      
      // Update subscription in our DB
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: 'CANCELED' as any, // Use uppercase to match Prisma enum
          metadata: {
            ...currentMetadata,
            canceledAt: new Date().toISOString()
          }
        }
      });
    }
  }

  // Handle invoice payment succeeded webhook
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Find subscription in our DB
    if ((invoice as any).subscription) {
      const dbSubscription = await prisma.subscription.findFirst({
        where: {
          metadata: {
            path: ['stripeSubscriptionId'],
            equals: (invoice as any).subscription
          }
        }
      });
      
      if (dbSubscription) {
        // Update subscription status if needed
        if (dbSubscription.status !== 'ACTIVE') {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: 'ACTIVE' as any // Use uppercase to match Prisma enum
            }
          });
        }
        
        // Here you could add logic to send a receipt email or update user permissions
      }
    }
  }

  // Handle invoice payment failed webhook
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Find subscription in our DB
    if ((invoice as any).subscription) {
      const dbSubscription = await prisma.subscription.findFirst({
        where: {
          metadata: {
            path: ['stripeSubscriptionId'],
            equals: (invoice as any).subscription
          }
        }
      });
      
      if (dbSubscription) {
        // Update subscription status
        await prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: {
            status: 'PAST_DUE' as any // Use uppercase to match Prisma enum
          }
        });
        
        // Here you could add logic to send a payment failed notification
      }
    }
  }

  // Handle customer updated webhook
  private async handleCustomerUpdated(customer: Stripe.Customer) {
    // Find customer in our DB
    const dbCustomer = await prisma.customer.findFirst({
      where: { stripeCustomerId: customer.id }
    });
    
    if (dbCustomer) {
      // Update customer in our DB
      await prisma.customer.update({
        where: { id: dbCustomer.id },
        data: {
          name: customer.name || dbCustomer.name,
          contactEmail: customer.email || dbCustomer.contactEmail
        }
      });
    }
  }
}