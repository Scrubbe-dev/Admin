"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorUtil = void 0;
class ErrorUtil {
    /**
     * Create standardized error response
     */
    static createErrorResponse(message, errors) {
        return {
            success: false,
            message,
            errors: errors || [],
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Log error with context
     */
    static logError(context, error) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ${context}:`, {
            message: error.message,
            stack: error.stack,
            ...error
        });
    }
}
exports.ErrorUtil = ErrorUtil;
