"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRIPE_PLANS = void 0;
exports.getPlanByTypeAndCycle = getPlanByTypeAndCycle;
exports.formatAmount = formatAmount;
exports.calculateProratedAmount = calculateProratedAmount;
exports.validateWebhookSignature = validateWebhookSignature;
exports.handleStripeError = handleStripeError;
const pricing_types_1 = require("./pricing.types");
exports.STRIPE_PLANS = {
    [pricing_types_1.PlanType.STARTER]: {
        [pricing_types_1.BillingCycle.MONTHLY]: {
            name: 'Starter',
            type: pricing_types_1.PlanType.STARTER,
            price: 15,
            billingCycle: pricing_types_1.BillingCycle.MONTHLY,
            currency: 'usd',
            description: 'Perfect for individuals and small teams getting started',
            pricingDuration: "14-day free trial",
            isPopular: false,
            features: [
                {
                    Description: "For small teams getting started with incident management.",
                    Price: "$0/month",
                    Users: "Up to 10 users",
                    Incidents: "Unlimited incidents with postmortems",
                    Integration: "Basic GitHub and GitLab",
                    "Dashboards & Reporting": "Basic",
                    "SLA Tracking": "❌",
                    "MSP Clients": "1 single tenant",
                    "Access Control": "❌",
                    Support: "Community",
                    Action: "Get started for free",
                },
            ]
        },
        [pricing_types_1.BillingCycle.YEARLY]: {
            name: 'Starter',
            type: pricing_types_1.PlanType.STARTER,
            price: 153,
            billingCycle: pricing_types_1.BillingCycle.YEARLY,
            currency: 'usd',
            description: 'Perfect for individuals and small teams getting started',
            pricingDuration: " $153/agent/year (save 15%)",
            isPopular: false,
            features: [
                {
                    Description: "For small teams getting started with incident management.",
                    Price: "$0/month",
                    Users: "Up to 10 users",
                    Incidents: "Unlimited incidents with postmortems",
                    Integration: "Basic GitHub and GitLab",
                    "Dashboards & Reporting": "Basic",
                    "SLA Tracking": "❌",
                    "MSP Clients": "1 single tenant",
                    "Access Control": "❌",
                    Support: "Community",
                    Action: "Get started for free",
                },
            ]
        }
    },
    [pricing_types_1.PlanType.GROWTH]: {
        [pricing_types_1.BillingCycle.MONTHLY]: {
            name: 'Growth',
            type: pricing_types_1.PlanType.GROWTH,
            price: 35,
            billingCycle: pricing_types_1.BillingCycle.MONTHLY,
            currency: 'usd',
            description: 'For growing teams that need more power',
            isPopular: false,
            features: [
                {
                    Description: "For scaling startups and SMBs that need structure.",
                    Price: "$9/user/month",
                    Users: "Up to 50 users",
                    Incidents: "Unlimited incidents with postmortems",
                    Integration: "Full: Slack, GitHub, GitLab, Zoom, Google Meet",
                    "Dashboards & Reporting": "Basic",
                    "SLA Tracking": "MTTR and MTTA",
                    "MSP Clients": "Up to 5",
                    "Access Control": "❌",
                    Support: "Email (24-hour response)",
                    Action: "Start 14 days free trial",
                },
            ]
        },
        [pricing_types_1.BillingCycle.YEARLY]: {
            name: 'Growth',
            type: pricing_types_1.PlanType.GROWTH,
            price: 357,
            billingCycle: pricing_types_1.BillingCycle.YEARLY,
            currency: 'usd',
            description: 'For growing teams that need more power',
            pricingDuration: "$357/agent/year (save 15%)",
            isPopular: false,
            features: [
                {
                    Description: "For scaling startups and SMBs that need structure.",
                    Price: "$9/user/month",
                    Users: "Up to 50 users",
                    Incidents: "Unlimited incidents with postmortems",
                    Integration: "Full: Slack, GitHub, GitLab, Zoom, Google Meet",
                    "Dashboards & Reporting": "Basic",
                    "SLA Tracking": "MTTR and MTTA",
                    "MSP Clients": "Up to 5",
                    "Access Control": "❌",
                    Support: "Email (24-hour response)",
                    Action: "Start 14 days free trial",
                },
            ]
        }
    },
    [pricing_types_1.PlanType.PRO]: {
        [pricing_types_1.BillingCycle.MONTHLY]: {
            name: 'Pro',
            type: pricing_types_1.PlanType.PRO,
            price: 85,
            billingCycle: pricing_types_1.BillingCycle.MONTHLY,
            currency: 'usd',
            description: 'For businesses that need advanced features',
            isPopular: true,
            features: [
                {
                    Description: "For MSPs and mission-critical businesses.",
                    Price: "$19/user/month",
                    Users: "Unlimited users",
                    Incidents: "Unlimited incidents with postmortems",
                    Integration: "Full: Slack, GitHub, GitLab, Zoom, Google Meet, Custom API/Webhooks",
                    "Dashboards & Reporting": "Advanced with fraud and incidents", // Corrected from "Advanced with fraud reports"
                    "SLA Tracking": "Enforcement with auto escalations, 99.9% uptime",
                    "MSP Clients": "Unlimited",
                    "Access Control": "Role-based",
                    Support: "Priority email and chat",
                    Action: "Start 14 days free trial",
                },
            ]
        },
        [pricing_types_1.BillingCycle.YEARLY]: {
            name: 'Pro',
            type: pricing_types_1.PlanType.PRO,
            price: 867,
            billingCycle: pricing_types_1.BillingCycle.YEARLY,
            currency: 'usd',
            description: 'For businesses that need advanced features',
            pricingDuration: "$867/agent/year (save 15%)",
            isPopular: true,
            features: [
                {
                    Description: "For MSPs and mission-critical businesses.",
                    Price: "$19/user/month",
                    Users: "Unlimited users",
                    Incidents: "Unlimited incidents with postmortems",
                    Integration: "Full: Slack, GitHub, GitLab, Zoom, Google Meet, Custom API/Webhooks",
                    "Dashboards & Reporting": "Advanced with fraud and incidents", // Corrected from "Advanced with fraud reports"
                    "SLA Tracking": "Enforcement with auto escalations, 99.9% uptime",
                    "MSP Clients": "Unlimited",
                    "Access Control": "Role-based",
                    Support: "Priority email and chat",
                    Action: "Start 14 days free trial",
                },
            ]
        }
    },
    [pricing_types_1.PlanType.ENTERPRISE]: {
        [pricing_types_1.BillingCycle.MONTHLY]: {
            name: 'Enterprise',
            type: pricing_types_1.PlanType.ENTERPRISE,
            price: 0,
            billingCycle: pricing_types_1.BillingCycle.MONTHLY,
            currency: 'usd',
            description: 'Custom solution for large organizations',
            pricingDuration: "Custom Pricing",
            isPopular: false,
            features: [
                {
                    Description: "For banks, telcos, governments, and large organizations with compliance needs.",
                    Price: "Custom from $9/user/month",
                    Users: "Unlimited users",
                    Incidents: "Unlimited incidents with postmortems",
                    Integration: "Full: Slack, GitHub, GitLab, Zoom, Google Meet, Custom API/Webhooks, SSO (Azure AD, Okta, AWS Cognito)",
                    "Dashboards & Reporting": "Advanced with compliance (PCI, ISO, SOC2)",
                    "SLA Tracking": "Enforcement with auto escalations, 99.9% uptime",
                    "MSP Clients": "Unlimited",
                    "Access Control": "Role-based",
                    Support: "24/7 phone, dedicated manager",
                    Action: "Start 14 days free trial",
                },
            ]
        },
        [pricing_types_1.BillingCycle.YEARLY]: {
            name: 'Enterprise',
            type: pricing_types_1.PlanType.ENTERPRISE,
            price: 0,
            billingCycle: pricing_types_1.BillingCycle.YEARLY,
            currency: 'usd',
            description: 'Custom solution for large organizations',
            pricingDuration: "Custom pricing",
            isPopular: false,
            features: [
                {
                    Description: "For banks, telcos, governments, and large organizations with compliance needs.",
                    Price: "Custom from $9/user/month",
                    Users: "Unlimited users",
                    Incidents: "Unlimited incidents with postmortems",
                    Integration: "Full: Slack, GitHub, GitLab, Zoom, Google Meet, Custom API/Webhooks, SSO (Azure AD, Okta, AWS Cognito)",
                    "Dashboards & Reporting": "Advanced with compliance (PCI, ISO, SOC2)",
                    "SLA Tracking": "Enforcement with auto escalations, 99.9% uptime",
                    "MSP Clients": "Unlimited",
                    "Access Control": "Role-based",
                    Support: "24/7 phone, dedicated manager",
                    Action: "Start 14 days free trial",
                },
            ]
        }
    }
};
function getPlanByTypeAndCycle(planType, billingCycle) {
    return exports.STRIPE_PLANS[planType][billingCycle];
}
function formatAmount(amount, currency) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'usd',
    }).format(amount);
}
function calculateProratedAmount(currentPlan, newPlan, daysRemaining, daysInMonth) {
    const currentDailyRate = currentPlan.price / daysInMonth;
    const newDailyRate = newPlan.price / daysInMonth;
    const currentProrated = currentDailyRate * daysRemaining;
    const newProrated = newDailyRate * daysRemaining;
    return newProrated - currentProrated;
}
function validateWebhookSignature(payload, signature, webhookSecret) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    try {
        stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        return true;
    }
    catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return false;
    }
}
function handleStripeError(error) {
    return {
        message: error.message || 'An unexpected error occurred with Stripe',
        code: error.code || 'stripe_error',
        statusCode: error.statusCode || 500
    };
}
