import { Router, Request, Response } from "express";
import { PricingController } from "./pricing.controller";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { TokenService } from "../auth/services/token.service";

const pricingRouter = Router();
const pricingController = new PricingController();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const authMiddleware = new AuthMiddleware(tokenService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Plan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique plan identifier
 *           example: "growth-monthly"
 *         name:
 *           type: string
 *           description: Plan name
 *           example: "Growth"
 *         type:
 *           type: string
 *           enum: [starter, growth, pro, enterprise]
 *           description: Plan type
 *           example: "growth"
 *         price:
 *           type: number
 *           description: Price per user per billing cycle
 *           example: 9
 *         billingCycle:
 *           type: string
 *           enum: [month, year]
 *           description: Billing cycle
 *           example: "month"
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: "usd"
 *         description:
 *           type: string
 *           description: Plan description
 *           example: "For growing teams that need more power"
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: List of plan features
 *           example: ["Up to 20 users", "Advanced incident management"]
 *         stripePriceId:
 *           type: string
 *           description: Stripe price ID
 *           example: "price_1ABC123XYZ456"
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Subscription ID
 *           example: "sub_1ABC123XYZ456"
 *         customerId:
 *           type: string
 *           description: Customer ID
 *           example: "cus_1ABC123XYZ456"
 *         planId:
 *           type: string
 *           description: Plan ID
 *           example: "growth-monthly"
 *         status:
 *           type: string
 *           enum: [active, past_due, canceled, unpaid, incomplete, incomplete_expired]
 *           description: Subscription status
 *           example: "active"
 *         currentPeriodStart:
 *           type: string
 *           format: date-time
 *           description: Start of current billing period
 *           example: "2023-01-01T00:00:00.000Z"
 *         currentPeriodEnd:
 *           type: string
 *           format: date-time
 *           description: End of current billing period
 *           example: "2023-02-01T00:00:00.000Z"
 *         cancelAtPeriodEnd:
 *           type: boolean
 *           description: Whether subscription will cancel at period end
 *           example: false
 *         quantity:
 *           type: integer
 *           description: Number of users
 *           example: 5
 *         trialEnd:
 *           type: string
 *           format: date-time
 *           description: Trial end date
 *           example: "2023-01-15T00:00:00.000Z"
 *     CreateSubscriptionRequest:
 *       type: object
 *       required:
 *         - planType
 *         - billingCycle
 *         - quantity
 *         - paymentMethodId
 *       properties:
 *         planType:
 *           type: string
 *           enum: [starter, growth, pro, enterprise]
 *           description: Plan type
 *           example: "growth"
 *         billingCycle:
 *           type: string
 *           enum: [month, year]
 *           description: Billing cycle
 *           example: "month"
 *         quantity:
 *           type: integer
 *           description: Number of users
 *           example: 5
 *         paymentMethodId:
 *           type: string
 *           description: Stripe payment method ID
 *           example: "pm_1ABC123XYZ456"
 *         trialDays:
 *           type: integer
 *           description: Number of trial days
 *           example: 14
 *     UpdateSubscriptionRequest:
 *       type: object
 *       required:
 *         - subscriptionId
 *         - planType
 *         - billingCycle
 *         - quantity
 *       properties:
 *         subscriptionId:
 *           type: string
 *           description: Subscription ID
 *           example: "sub_1ABC123XYZ456"
 *         planType:
 *           type: string
 *           enum: [starter, growth, pro, enterprise]
 *           description: New plan type
 *           example: "pro"
 *         billingCycle:
 *           type: string
 *           enum: [month, year]
 *           description: New billing cycle
 *           example: "year"
 *         quantity:
 *           type: integer
 *           description: New number of users
 *           example: 10
 *         prorationBehavior:
 *           type: string
 *           enum: [create_prorations, none, always_invoice]
 *           description: How to handle prorations
 *           example: "create_prorations"
 *     CancelSubscriptionRequest:
 *       type: object
 *       required:
 *         - subscriptionId
 *       properties:
 *         subscriptionId:
 *           type: string
 *           description: Subscription ID
 *           example: "sub_1ABC123XYZ456"
 *         immediate:
 *           type: boolean
 *           description: Whether to cancel immediately or at period end
 *           example: false
 *     PortalSessionRequest:
 *       type: object
 *       required:
 *         - customerId
 *         - returnUrl
 *       properties:
 *         customerId:
 *           type: string
 *           description: Customer ID
 *           example: "cus_1ABC123XYZ456"
 *         returnUrl:
 *           type: string
 *           description: URL to return to after portal session
 *           example: "https://example.com/account"
 *     PortalSessionResponse:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: Customer portal session URL
 *           example: "https://billing.stripe.com/session/..."
 *     Invoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Invoice ID
 *           example: "in_1ABC123XYZ456"
 *         customerId:
 *           type: string
 *           description: Customer ID
 *           example: "cus_1ABC123XYZ456"
 *         subscriptionId:
 *           type: string
 *           description: Subscription ID
 *           example: "sub_1ABC123XYZ456"
 *         amount:
 *           type: number
 *           description: Invoice amount
 *           example: 45.00
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: "usd"
 *         status:
 *           type: string
 *           enum: [draft, open, paid, uncollectible, void]
 *           description: Invoice status
 *           example: "paid"
 *         hostedInvoiceUrl:
 *           type: string
 *           description: Hosted invoice URL
 *           example: "https://pay.stripe.com/invoice/..."
 *         pdfUrl:
 *           type: string
 *           description: Invoice PDF URL
 *           example: "https://pay.stripe.com/invoice/..."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Invoice creation date
 *           example: "2023-01-01T00:00:00.000Z"
 *     PaymentMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Payment method ID
 *           example: "pm_1ABC123XYZ456"
 *         type:
 *           type: string
 *           enum: [card, sepa_debit, ideal, bancontact, sofort, giropay, eps]
 *           description: Payment method type
 *           example: "card"
 *         last4:
 *           type: string
 *           description: Last 4 digits of card
 *           example: "4242"
 *         brand:
 *           type: string
 *           description: Card brand
 *           example: "visa"
 *         expMonth:
 *           type: integer
 *           description: Card expiration month
 *           example: 12
 *         expYear:
 *           type: integer
 *           description: Card expiration year
 *           example: 2025
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default payment method
 *           example: true
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Response status
 *           example: "error"
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Subscription not found"
 *         code:
 *           type: string
 *           description: Error code
 *           example: "subscription_not_found"
 */

/**
 * @swagger
 * /api/v1/pricing/plans:
 *   get:
 *     summary: Get all available pricing plans
 *     description: Retrieve a list of all available pricing plans with their features and pricing
 *     tags:
 *       - Pricing
 *     responses:
 *       200:
 *         description: Successfully retrieved plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.get("/plans", async (req: Request, res: Response) => {
  pricingController.getPlans(req, res);
});

/**
 * @swagger
 * /api/v1/pricing/subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     description: Create a new subscription for a customer with a specific plan and billing cycle
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Successfully created subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.post(
  "/subscriptions",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.createSubscription(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/subscriptions:
 *   put:
 *     summary: Update an existing subscription
 *     description: Update a subscription to change plan, billing cycle, or quantity
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Successfully updated subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Subscription not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.put(
  "/subscriptions",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.updateSubscription(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/subscriptions/cancel:
 *   post:
 *     summary: Cancel a subscription
 *     description: Cancel a subscription immediately or at the end of the current billing period
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Successfully canceled subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Subscription not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.post(
  "/subscriptions/cancel",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.cancelSubscription(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/customers/{customerId}/subscriptions:
 *   get:
 *     summary: Get customer subscriptions
 *     description: Retrieve all subscriptions for a specific customer
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *           example: "cus_1ABC123XYZ456"
 *     responses:
 *       200:
 *         description: Successfully retrieved subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Bad request - Missing customerId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.get(
  "/customers/:customerId/subscriptions",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.getCustomerSubscriptions(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/portal:
 *   post:
 *     summary: Create customer portal session
 *     description: Create a Stripe customer portal session for managing subscriptions and payment methods
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PortalSessionRequest'
 *     responses:
 *       200:
 *         description: Successfully created portal session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/PortalSessionResponse'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.post(
  "/portal",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.createPortalSession(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/customers/{customerId}/invoices:
 *   get:
 *     summary: Get customer invoices
 *     description: Retrieve all invoices for a specific customer
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *           example: "cus_1ABC123XYZ456"
 *     responses:
 *       200:
 *         description: Successfully retrieved invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Bad request - Missing customerId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.get(
  "/customers/:customerId/invoices",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.getCustomerInvoices(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/customers/{customerId}/payment-methods:
 *   get:
 *     summary: Get customer payment methods
 *     description: Retrieve all payment methods for a specific customer
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *           example: "cus_1ABC123XYZ456"
 *     responses:
 *       200:
 *         description: Successfully retrieved payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentMethod'
 *       400:
 *         description: Bad request - Missing customerId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.get(
  "/customers/:customerId/payment-methods",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.getCustomerPaymentMethods(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/webhook:
 *   post:
 *     summary: Handle Stripe webhooks
 *     description: Webhook endpoint to handle events from Stripe
 *     tags:
 *       - Pricing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pricingRouter.post("/webhook", (req: Request, res: Response) => {
  pricingController.handleWebhook(req, res);
});

// Add these routes to your pricing.routes.ts file

/**
 * @swagger
 * /api/v1/pricing/checkout/create-session:
 *   post:
 *     summary: Create checkout session for subscription
 *     description: Create a Stripe Checkout session for subscription payment
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planType
 *               - billingCycle
 *               - quantity
 *               - successUrl
 *               - cancelUrl
 *             properties:
 *               planType:
 *                 type: string
 *                 enum: [starter, growth, pro, enterprise]
 *                 example: "growth"
 *               billingCycle:
 *                 type: string
 *                 enum: [month, year]
 *                 example: "month"
 *               quantity:
 *                 type: integer
 *                 example: 5
 *               trialDays:
 *                 type: integer
 *                 example: 14
 *               successUrl:
 *                 type: string
 *                 example: "https://yourdomain.com/success"
 *               cancelUrl:
 *                 type: string
 *                 example: "https://yourdomain.com/cancel"
 *     responses:
 *       200:
 *         description: Successfully created checkout session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       example: "cs_1ABC123def456"
 *                     url:
 *                       type: string
 *                       example: "https://checkout.stripe.com/pay/cs_1ABC123def456"
 */
pricingRouter.post(
  "/checkout/create-session",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.createCheckoutSession(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/checkout/success:
 *   get:
 *     summary: Handle successful checkout
 *     description: Process successful checkout and create subscription in database
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: session_id
 *         in: query
 *         required: true
 *         description: Checkout session ID
 *         schema:
 *           type: string
 *           example: "cs_1ABC123def456"
 *     responses:
 *       200:
 *         description: Successfully processed checkout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 */
pricingRouter.get(
  "/checkout/success",
  authMiddleware.authenticate,
  (req: Request, res: Response) => {
    pricingController.handleCheckoutSuccess(req, res);
  }
);

/**
 * @swagger
 * /api/v1/pricing/checkout/session/{sessionId}:
 *   get:
 *     summary: Get checkout session details
 *     description: Retrieve details of a specific checkout session
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         description: Checkout session ID
 *         schema:
 *           type: string
 *           example: "cs_1ABC123def456"
 *     responses:
 *       200:
 *         description: Successfully retrieved session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "cs_1ABC123def456"
 *                     status:
 *                       type: string
 *                       example: "complete"
 *                     customer:
 *                       type: string
 *                       example: "cus_1ABC123XYZ456"
 *                     subscription:
 *                       type: string
 *                       example: "sub_1ABC123def456"
 */
pricingRouter.get(
  "/checkout/session/:sessionId",
  authMiddleware.authenticate,
  async (req: Request, res: Response) => {
    pricingController.handleCheckoutSession(req, res);
  }
);

export default pricingRouter;
