"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyController = void 0;
const apikey_service_1 = require("./apikey.service");
const apikey_schema_1 = require("./apikey.schema");
const apiKeyService = new apikey_service_1.ApiKeyService();
class ApiKeyController {
    async createApiKey(req, res) {
        const validation = apikey_schema_1.createApiKeySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Validation error",
                details: validation.error.errors,
            });
        }
        try {
            const payload = {
                ...validation.data,
                userId: req.user.id, // From auth middleware
            };
            const apiKey = await apiKeyService.createApiKey(payload);
            // Format the response
            const response = {
                key: apiKey.key, // This is the only time the raw key is returned
                environment: apiKey.environment,
                name: String(apiKey.metadata.name),
                createdAt: apiKey.metadata.createdAt,
                expiresAt: apiKey.metadata.expiresAt,
                isActive: apiKey.metadata.isActive,
                scopes: apiKey.scopes,
            };
            return res.status(201).json(response);
        }
        catch (error) {
            console.error("Error creating API key:", error);
            return res.status(500).json({
                error: "Internal server error",
            });
        }
    }
    async verifyApiKey(req, res, next) {
        const validation = apikey_schema_1.verifyApiKeySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Validation error",
                details: validation.error.errors,
            });
        }
        try {
            const verification = await apiKeyService.verifyApiKey(validation.data.apiKey, validation.data.expectedEnv);
            return res.status(200).json(verification);
        }
        catch (error) {
            console.error("Error verifying API key:", error);
            next(error);
            return res.status(500).json({
                error: "Internal server error",
            });
        }
    }
    async listApiKeys(req, res) {
        const validation = apikey_schema_1.listApiKeysSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({
                error: "Validation error",
                details: validation.error.errors,
            });
        }
        try {
            const filter = {
                isActive: validation.data.isActive,
            };
            const apiKeys = await apiKeyService.listApiKeys(req.user.id, filter);
            // Don't expose hashed keys or internal metadata
            const response = apiKeys.map((key) => ({
                name: key.metadata.name,
                environment: key.environment,
                createdAt: key.metadata.createdAt,
                expiresAt: key.metadata.expiresAt,
                lastUsed: key.metadata.lastUsed,
                isActive: key.metadata.isActive,
                scopes: key.scopes,
            }));
            return res.status(200).json(response);
        }
        catch (error) {
            console.error("Error listing API keys:", error);
            return res.status(500).json({
                error: "Internal server error",
            });
        }
    }
    async revokeApiKey(req, res) {
        const { keyId } = req.params;
        if (!keyId) {
            return res.status(400).json({
                error: "Key ID is required",
            });
        }
        try {
            const success = await apiKeyService.revokeApiKey(keyId, req.user.id);
            if (!success) {
                return res.status(404).json({
                    error: "API key not found or not owned by user",
                });
            }
            return res.status(200).json({
                message: "API key revoked successfully",
            });
        }
        catch (error) {
            console.error("Error revoking API key:", error);
            return res.status(500).json({
                error: "Internal server error",
            });
        }
    }
    async updateApiKey(req, res) {
        const { keyId } = req.params;
        const validation = apikey_schema_1.updateApiKeySchema.safeParse(req.body);
        if (!keyId) {
            return res.status(400).json({
                error: "Key ID is required",
            });
        }
        if (!validation.success) {
            return res.status(400).json({
                error: "Validation error",
                details: validation.error.errors,
            });
        }
        try {
            const updates = validation.data;
            const updatedKey = await apiKeyService.updateApiKey(keyId, req.user.id, {
                metadata: updates,
            });
            if (!updatedKey) {
                return res.status(404).json({
                    error: "API key not found or not owned by user",
                });
            }
            // Format the response
            const response = {
                name: updatedKey.metadata.name,
                createdAt: updatedKey.metadata.createdAt,
                updatedAt: updatedKey.metadata.updatedAt,
                expiresAt: updatedKey.metadata.expiresAt,
                lastUsed: updatedKey.metadata.lastUsed,
                isActive: updatedKey.metadata.isActive,
                scopes: updatedKey.scopes,
            };
            return res.status(200).json(response);
        }
        catch (error) {
            console.error("Error updating API key:", error);
            return res.status(500).json({
                error: "Internal server error",
            });
        }
    }
}
exports.ApiKeyController = ApiKeyController;
