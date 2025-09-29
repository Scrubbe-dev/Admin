"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuthMiddleware = apiKeyAuthMiddleware;
exports.requireScopes = requireScopes;
const apikey_service_1 = require("./apikey.service");
const client_1 = require("@prisma/client");
const apiKeyService = new apikey_service_1.ApiKeyService();
async function apiKeyAuthMiddleware(req, res, next) {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;
    if (!apiKey || typeof apiKey !== "string") {
        return res.status(401).json({
            error: "API key is required",
        });
    }
    const verification = await apiKeyService.verifyApiKey(apiKey);
    if (!verification.isValid) {
        return res.status(401).json({
            error: "Invalid API key",
        });
    }
    if (!verification.isActive) {
        return res.status(403).json({
            error: verification.isExpired
                ? "API key has expired"
                : "API key is inactive",
        });
    }
    // Attach user and scopes to the request for downstream use
    req.user = {
        id: verification.userId,
        sub: "",
        firstName: "",
        lastName: "",
        email: "",
        accountType: client_1.AccountType.DEVELOPER,
        businessId: "",
        scopes: []
    };
    next();
}
function requireScopes(requiredScopes) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const hasAllScopes = requiredScopes.some((scope) => req.user.scopes.includes(scope));
        if (!hasAllScopes) {
            return res.status(403).json({
                error: `Insufficient permissions. Required scopes: ${requiredScopes.join(", ")}`,
            });
        }
        return next();
    };
}
