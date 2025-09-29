"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
class RateLimiterMiddleware {
    static createForgotPasswordLimiter() {
        return (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 3, // Limit each IP to 3 requests per windowMs
            message: {
                error: "Too many password reset attempts. Please try again after 15 minutes."
            },
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        });
    }
    static createResetPasswordLimiter() {
        return (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Limit each IP to 5 requests per windowMs
            message: {
                error: "Too many password reset attempts. Please try again after 15 minutes."
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
    }
}
exports.RateLimiterMiddleware = RateLimiterMiddleware;
