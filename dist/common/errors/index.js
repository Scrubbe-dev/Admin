"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudDetectionError = exports.AuthenticationError = void 0;
class AuthenticationError extends Error {
    code = 'AUTH_FAILURE';
    statusCode = 401;
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class FraudDetectionError extends Error {
    riskScore;
    code = 'FRAUD_FLAGGED';
    statusCode = 403;
    constructor(riskScore) {
        super(`High-risk activity detected (score: ${riskScore})`);
        this.riskScore = riskScore;
        this.name = 'FraudDetectionError';
    }
}
exports.FraudDetectionError = FraudDetectionError;
