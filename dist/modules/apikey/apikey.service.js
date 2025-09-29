"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const uuid_1 = require("uuid");
const crypto_1 = require("crypto");
const apikey_types_1 = require("./apikey.types");
// In a production environment, you would use a database
const API_KEYS = {};
class ApiKeyService {
    generateApiKey(env) {
        const prefix = env === apikey_types_1.Environment.PRODUCTION ? "sk_prod_" : "sk_test_";
        const randomPart = (0, crypto_1.randomBytes)(16).toString("hex");
        const uniquePart = (0, uuid_1.v4)().replace(/-/g, "");
        return `${prefix}${randomPart}${uniquePart}`.slice(0, 64);
    }
    hashApiKey(key) {
        return (0, crypto_1.createHash)("sha256").update(key).digest("hex");
    }
    async createApiKey(payload) {
        const rawKey = this.generateApiKey(payload.environment);
        const hashedKey = this.hashApiKey(rawKey);
        const expiresAt = payload.expiresInDays
            ? new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000)
            : undefined;
        const apiKey = {
            key: hashedKey,
            version: 1,
            environment: payload.environment,
            metadata: {
                name: payload.name,
                userId: payload.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt,
                isActive: true,
            },
            scopes: payload.scopes || ["default"],
        };
        API_KEYS[hashedKey] = apiKey;
        // Return the raw key only once - it should never be stored or shown again
        return {
            ...apiKey,
            key: rawKey,
        };
    }
    async verifyApiKey(apiKey, expectedEnv) {
        const hashedKey = this.hashApiKey(apiKey);
        const storedKey = API_KEYS[hashedKey];
        if (!storedKey) {
            return {
                isValid: false,
                isActive: false,
                isExpired: false,
            };
        }
        if (expectedEnv && storedKey.environment !== expectedEnv) {
            return {
                isValid: false,
                isActive: false,
                isExpired: false,
            };
        }
        // Update last used timestamp
        storedKey.metadata.lastUsed = new Date();
        API_KEYS[hashedKey] = storedKey;
        const isExpired = storedKey.metadata.expiresAt
            ? new Date() > storedKey.metadata.expiresAt
            : false;
        return {
            isValid: true,
            isActive: storedKey.metadata.isActive && !isExpired,
            isExpired,
            userId: storedKey.metadata.userId,
            scopes: storedKey.scopes,
            name: storedKey.metadata.name,
        };
    }
    async listApiKeys(userId, filter = {}) {
        return Object.values(API_KEYS)
            .filter((key) => key.metadata.userId === userId)
            .filter((key) => filter.isActive === undefined ||
            key.metadata.isActive === filter.isActive)
            .filter((key) => !filter.name || key.metadata.name?.includes(filter.name));
    }
    async revokeApiKey(hashedKey, userId) {
        const key = API_KEYS[hashedKey];
        if (!key || key.metadata.userId !== userId) {
            return false;
        }
        key.metadata.isActive = false;
        key.metadata.updatedAt = new Date();
        API_KEYS[hashedKey] = key;
        return true;
    }
    async updateApiKey(hashedKey, userId, updates) {
        const key = API_KEYS[hashedKey];
        if (!key || key.metadata.userId !== userId) {
            return null;
        }
        const updatedKey = {
            ...key,
            ...updates,
            metadata: {
                ...key.metadata,
                ...updates.metadata,
                updatedAt: new Date(),
            },
        };
        API_KEYS[hashedKey] = updatedKey;
        return updatedKey;
    }
}
exports.ApiKeyService = ApiKeyService;
