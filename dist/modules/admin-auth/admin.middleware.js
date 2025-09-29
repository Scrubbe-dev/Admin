"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGuard = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const admin_utils_1 = require("./admin.utils");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new admin_utils_1.ApiError(401, 'Unauthorized'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        next(new admin_utils_1.ApiError(401, 'Invalid or expired token'));
    }
};
exports.authenticateJWT = authenticateJWT;
const adminGuard = (req, res, next) => {
    if (!req.user) {
        return next(new admin_utils_1.ApiError(403, 'Forbidden - admin access required'));
    }
    next();
};
exports.adminGuard = adminGuard;
