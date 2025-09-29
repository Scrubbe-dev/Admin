"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const error_1 = require("../error");
class AuthMiddleware {
    tokenService;
    constructor(tokenService) {
        this.tokenService = tokenService;
    }
    // In your AuthMiddleware class, update the authenticate method
    authenticate = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                throw new error_1.UnauthorizedError("Authentication required");
            }
            const token = authHeader.split(" ")[1];
            const payload = await this.tokenService.verifyAccessToken(token);
            // Ensure we have the user ID in the payload
            if (!payload.sub) {
                throw new error_1.UnauthorizedError("Invalid token: missing user ID");
            }
            req.user = payload;
            next();
        }
        catch (err) {
            next(err);
        }
    };
    authorize = (roles) => {
        return (req, res, next) => {
            if (!req.user) {
                throw new error_1.UnauthorizedError("Authentication required");
            }
            const hasRequiredRole = roles.some((role) => req.user.roles.includes(role));
            if (!hasRequiredRole) {
                throw new error_1.ForbiddenError("Insufficient permissions");
            }
            next();
        };
    };
}
exports.AuthMiddleware = AuthMiddleware;
