"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.errorHandler = exports.validationMiddleware = exports.rateLimitMiddleware = exports.requestIdMiddleware = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const bec_schema_1 = require("../../modules/bec/bec.schema");
const logger_1 = require("../../common/logger/logger");
const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 10, // 10 requests
    duration: 60, // per 60 seconds
});
const requestIdMiddleware = (req, res, next) => {
    req.requestId = req.headers['x-request-id']?.toString() || (0, uuid_1.v4)();
    res.setHeader('X-Request-ID', req.requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
const rateLimitMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(String(req.ip));
        next();
    }
    catch (rejRes) {
        res.status(429).json({
            request_id: req.requestId,
            timestamp: new Date().toISOString(),
            status: 'error',
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
        });
    }
};
exports.rateLimitMiddleware = rateLimitMiddleware;
const validationMiddleware = (req, res, next) => {
    try {
        bec_schema_1.emailRequestSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const response = {
                request_id: req.requestId,
                timestamp: new Date().toISOString(),
                status: 'error',
                code: 'VALIDATION_ERROR',
                message: 'Invalid request payload',
                details: error.errors,
            };
            return res.status(400).json(response);
        }
        next(error);
    }
};
exports.validationMiddleware = validationMiddleware;
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('Request failed', {
        requestId: req.requestId,
        error: err.message,
        stack: err.stack,
    });
    const statusCode = 500;
    const response = {
        request_id: req.requestId,
        timestamp: new Date().toISOString(),
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
    };
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    //   if (!apiKey || apiKey !== env.API_KEY) {
    if (!apiKey || apiKey) {
        const response = {
            request_id: req.requestId,
            timestamp: new Date().toISOString(),
            status: 'error',
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing API key',
        };
        return res.status(401).json(response);
    }
    next();
};
exports.authMiddleware = authMiddleware;
