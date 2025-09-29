"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingController = void 0;
const pricing_services_1 = require("./pricing.services");
const pricing_utils_1 = require("./pricing.utils");
const pricingService = new pricing_services_1.PricingService();
class PricingController {
    // Get all available plans
    async getPlans(req, res) {
        try {
            const result = await pricingService.getPlans();
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to get plans',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Get plans error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Create a new subscription
    async createSubscription(req, res) {
        try {
            const { planType, billingCycle, quantity, paymentMethodId, trialDays } = req.body;
            const user = req.user; // Assuming user is attached to request by auth middleware
            if (!planType || !billingCycle || !quantity || !paymentMethodId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields: planType, billingCycle, quantity, paymentMethodId'
                });
            }
            const request = {
                planType,
                billingCycle,
                quantity,
                paymentMethodId,
                trialDays
            };
            const result = await pricingService.createSubscription(user.email, user.name, request);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to create subscription',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Create subscription error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Update an existing subscription
    async updateSubscription(req, res) {
        try {
            const { subscriptionId, planType, billingCycle, quantity, prorationBehavior } = req.body;
            if (!subscriptionId || !planType || !billingCycle || !quantity) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields: subscriptionId, planType, billingCycle, quantity'
                });
            }
            const request = {
                subscriptionId,
                planType,
                billingCycle,
                quantity,
                prorationBehavior
            };
            const result = await pricingService.updateSubscription(request);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to update subscription',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Update subscription error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Cancel a subscription
    async cancelSubscription(req, res) {
        try {
            const { subscriptionId, immediate } = req.body;
            if (!subscriptionId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required field: subscriptionId'
                });
            }
            const request = {
                subscriptionId,
                immediate: immediate || false
            };
            const result = await pricingService.cancelSubscription(request);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to cancel subscription',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Cancel subscription error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Get customer subscriptions
    async getCustomerSubscriptions(req, res) {
        try {
            const customerId = req.params.customerId;
            if (!customerId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameter: customerId'
                });
            }
            const result = await pricingService.getCustomerSubscriptions(customerId);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to get subscriptions',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Get customer subscriptions error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Create customer portal session
    async createPortalSession(req, res) {
        try {
            const { customerId, returnUrl } = req.body;
            if (!customerId || !returnUrl) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields: customerId, returnUrl'
                });
            }
            const request = {
                customerId,
                returnUrl
            };
            const result = await pricingService.createPortalSession(request);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to create portal session',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Create portal session error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Get customer invoices
    async getCustomerInvoices(req, res) {
        try {
            const customerId = req.params.customerId;
            if (!customerId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameter: customerId'
                });
            }
            const result = await pricingService.getCustomerInvoices(customerId);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to get invoices',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Get customer invoices error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Get customer payment methods
    async getCustomerPaymentMethods(req, res) {
        try {
            const customerId = req.params.customerId;
            if (!customerId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameter: customerId'
                });
            }
            const result = await pricingService.getCustomerPaymentMethods(customerId);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to get payment methods',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Get customer payment methods error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Handle Stripe webhooks
    async handleWebhook(req, res) {
        try {
            const sig = req.headers['stripe-signature'];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!sig) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing stripe-signature header'
                });
            }
            const event = req.body;
            // Verify webhook signature
            const isValid = (0, pricing_utils_1.validateWebhookSignature)(JSON.stringify(event, null, 2), sig, webhookSecret);
            if (!isValid) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid webhook signature'
                });
            }
            const result = await pricingService.handleWebhook(event);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to handle webhook',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                received: true
            });
        }
        catch (error) {
            console.error('Webhook handling error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    async handleCheckoutSession(req, res) {
        try {
            const { sessionId } = req.params;
            if (!sessionId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing sessionId parameter'
                });
            }
            const result = await pricingService.getCheckoutSession(sessionId);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to get checkout session',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Get checkout session error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    async createCheckoutSession(req, res) {
        try {
            const { planType, billingCycle, quantity, trialDays, successUrl, cancelUrl } = req.body;
            const user = req.user;
            if (!planType || !billingCycle || !quantity || !successUrl || !cancelUrl) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields: planType, billingCycle, quantity, successUrl, cancelUrl'
                });
            }
            const request = {
                planType,
                billingCycle,
                quantity,
                trialDays,
                successUrl,
                cancelUrl
            };
            const result = await pricingService.createCheckoutSession(user.email, user.name, request);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to create checkout session',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Create checkout session error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    // Handle successful checkout completion
    async handleCheckoutSuccess(req, res) {
        try {
            const { session_id } = req.query;
            if (!session_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing session_id parameter'
                });
            }
            const result = await pricingService.handleCheckoutSuccess(session_id);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    status: 'error',
                    message: result.error?.message || 'Failed to process checkout success',
                    code: result.error?.code
                });
            }
            return res.status(result.statusCode).json({
                status: 'success',
                data: result.data
            });
        }
        catch (error) {
            console.error('Handle checkout success error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
}
exports.PricingController = PricingController;
