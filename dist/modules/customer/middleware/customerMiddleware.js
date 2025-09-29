"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeCustomer = exports.authenticateCustomer = void 0;
const jwt_1 = require("../utils/jwt");
const authenticateCustomer = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        const response = {
            success: false,
            message: 'Access token required'
        };
        return res.status(401).json(response);
    }
    try {
        const customer = jwt_1.JWTUtils.verifyCustomerToken(token);
        req.customer = customer;
        next();
    }
    catch (error) {
        const response = {
            success: false,
            message: 'Invalid or expired token'
        };
        return res.status(403).json(response);
    }
};
exports.authenticateCustomer = authenticateCustomer;
const authorizeCustomer = (req, res, next) => {
    if (!req.customer || !req.customer.id) {
        const response = {
            success: false,
            message: 'Customer authorization required'
        };
        return res.status(403).json(response);
    }
    next();
};
exports.authorizeCustomer = authorizeCustomer;
