"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudDetectionService = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../../common/logger/logger");
class FraudDetectionService {
    HIGH_RISK_THRESHOLD = 70;
    MEDIUM_RISK_THRESHOLD = 40;
    async analyzeTransaction(request) {
        const requestId = `fraud-req-${(0, uuid_1.v4)().substring(0, 10)}`;
        const timestamp = new Date().toISOString();
        try {
            // Perform various fraud detection checks
            const riskFactors = await this.detectRiskFactors(request);
            const iocs = await this.extractIndicators(request);
            const metrics = this.calculateMetrics(request);
            // Generate assessment
            const fraudAssessment = this.generateFraudAssessment(riskFactors, metrics);
            return {
                request_id: requestId,
                transaction_id: request.transaction.id,
                timestamp,
                fraud_assessment: fraudAssessment,
                risk_factors: riskFactors,
                iocs,
                metrics
            };
        }
        catch (error) {
            logger_1.logger.error('Fraud analysis failed', { requestId, error });
            throw error;
        }
    }
    async detectRiskFactors(request) {
        const riskFactors = [];
        // 1. Check for IP geolocation mismatch
        const ipMismatch = this.checkIPLocationMismatch(request);
        if (ipMismatch)
            riskFactors.push(ipMismatch);
        // 2. Check transaction velocity
        const velocityRisk = this.checkTransactionVelocity(request);
        if (velocityRisk)
            riskFactors.push(velocityRisk);
        // 3. Check billing/shipping mismatch
        const addressMismatch = this.checkAddressMismatch(request);
        if (addressMismatch)
            riskFactors.push(addressMismatch);
        // 4. Check for unusual payment methods
        const paymentMethodRisk = this.checkPaymentMethodRisk(request);
        if (paymentMethodRisk)
            riskFactors.push(paymentMethodRisk);
        // 5. Check for device anomalies
        const deviceRisk = this.checkDeviceRisk(request);
        if (deviceRisk)
            riskFactors.push(deviceRisk);
        return riskFactors;
    }
    checkIPLocationMismatch(request) {
        // In production, this would call a geolocation service
        const isMismatch = Math.random() > 0.7; // Simulated check
        return isMismatch ? {
            type: 'ip_geolocation_mismatch',
            severity: 'medium',
            description: 'IP address location differs from billing address',
            confidence: 0.85
        } : null;
    }
    checkTransactionVelocity(request) {
        // In production, this would query transaction history
        const velocityScore = Math.min(request.customer.previous_transactions_count / 10, 1);
        return velocityScore > 0.5 ? {
            type: 'velocity',
            severity: 'low',
            description: 'Multiple transactions in short timeframe',
            confidence: velocityScore
        } : null;
    }
    checkAddressMismatch(request) {
        const shipping = request.shipping_address;
        const billing = request.billing_address;
        const isMismatch = shipping.address_line1 !== billing.address_line1 ||
            shipping.city !== billing.city ||
            shipping.country !== billing.country;
        return isMismatch ? {
            type: 'address_mismatch',
            severity: 'medium',
            description: 'Shipping and billing addresses differ significantly',
            confidence: 0.75
        } : null;
    }
    checkPaymentMethodRisk(request) {
        const { payment_method } = request.transaction;
        // Cryptocurrency transactions are higher risk
        if (payment_method.type === 'cryptocurrency') {
            return {
                type: 'payment_method_risk',
                severity: 'high',
                description: 'Cryptocurrency payments have higher fraud rates',
                confidence: 0.9
            };
        }
        // New payment methods are higher risk
        if (payment_method.tokenized_id.endsWith('NEW')) {
            return {
                type: 'payment_method_risk',
                severity: 'medium',
                description: 'New payment method with no transaction history',
                confidence: 0.7
            };
        }
        return null;
    }
    checkDeviceRisk(request) {
        // In production, this would check device reputation
        const isRisky = Math.random() > 0.8; // Simulated check
        return isRisky ? {
            type: 'device_risk',
            severity: 'high',
            description: 'Device associated with suspicious activity',
            confidence: 0.88
        } : null;
    }
    async extractIndicators(request) {
        const iocs = [];
        // IP address IOC
        iocs.push({
            type: 'ip_address',
            value: request.customer.ip_address,
            category: 'suspicious',
            context: 'Previously associated with 3 fraudulent transactions',
            first_seen: '2025-03-15T10:22:31Z'
        });
        // Device fingerprint IOC
        iocs.push({
            type: 'device_fingerprint',
            value: request.customer.device_fingerprint,
            category: 'monitoring',
            context: 'Device associated with multiple customer accounts'
        });
        return iocs;
    }
    calculateMetrics(request) {
        return {
            transaction_velocity: {
                hour: 3,
                day: 5,
                week: 12
            },
            historical_patterns: {
                average_transaction_amount: 352.47,
                standard_deviation: 124.86,
                z_score: 7.59
            },
            customer_risk_profile: {
                score: 18,
                percentile: 22
            }
        };
    }
    generateFraudAssessment(riskFactors, metrics) {
        // Calculate risk score (0-100)
        const baseScore = metrics.customer_risk_profile.score;
        const factorScore = riskFactors.reduce((sum, factor) => {
            const weight = factor.severity === 'high' ? 30 :
                factor.severity === 'medium' ? 20 : 10;
            return sum + (factor.confidence * weight);
        }, 0);
        const riskScore = Math.min(baseScore + factorScore, 100);
        // Determine recommendation
        let recommendation;
        if (riskScore >= this.HIGH_RISK_THRESHOLD) {
            recommendation = 'reject';
        }
        else if (riskScore >= this.MEDIUM_RISK_THRESHOLD) {
            recommendation = 'review';
        }
        else {
            recommendation = 'approve';
        }
        // Confidence based on factors and metrics
        const confidence = Math.min(0.9, // Base confidence
        riskFactors.length > 0
            ? riskFactors.reduce((sum, f) => sum + f.confidence, 0) / riskFactors.length
            : 0.95);
        return {
            risk_score: Math.round(riskScore),
            recommendation,
            confidence: parseFloat(confidence.toFixed(2))
        };
    }
}
exports.FraudDetectionService = FraudDetectionService;
