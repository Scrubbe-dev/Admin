"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTUtils {
    static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    static JWT_EXPIRES_IN = '7d';
    static CUSTOMER_JWT_EXPIRES_IN = '30d';
    // Existing user token methods
    static generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    }
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    // Customer-specific token methods
    static generateCustomerToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, { expiresIn: this.CUSTOMER_JWT_EXPIRES_IN });
    }
    static verifyCustomerToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}
exports.JWTUtils = JWTUtils;
