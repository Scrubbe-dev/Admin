"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apikey_controller_1 = require("./apikey.controller");
const apikey_middleware_1 = require("./apikey.middleware");
const auth_middleware_1 = require("../auth/middleware/auth.middleware");
const token_service_1 = require("../auth/services/token.service");
const router = (0, express_1.Router)();
const controller = new apikey_controller_1.ApiKeyController();
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15 // in mins
);
const authMiddleware = new auth_middleware_1.AuthMiddleware(tokenService);
// Middleware to protect all API key routes
// router.use(apiKeyAuthMiddleware as any);
router.use((req, res, next) => {
    authMiddleware.authenticate(req, res, next);
});
/**
 * @swagger
 * tags:
 *   name: Scrubbe API Keys
 *   description: Scrubbe API Key management endpoints
 */
/**
 * @swagger
 * /api/v1/apikey/createapikey:
 *   post:
 *     summary: Create a new API key
 *     description: |
 *       Generates a new API key with the specified permissions, environment, and expiration.
 *       The raw key will only be shown once — store it securely.
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - environment
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "My Production Key"
 *                 description: Descriptive name for the API key
 *               environment:
 *                 type: string
 *                 enum: [DEVELOPMENT, PRODUCTION]
 *                 example: "PRODUCTION"
 *                 description: |
 *                   Environment for which the API key will be used.
 *                   `test` keys are for sandbox usage, `production` keys are for live usage.
 *               expiresInDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 example: 30
 *                 description: Number of days until key expiration (optional)
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["api-key:create", "api-key:read"]
 *                 description: List of permission scopes for this key
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                   example: "sk_live_1234567890abcdef1234567890abcdef"
 *                   description: The raw API key (only shown once)
 *                 name:
 *                   type: string
 *                   example: "My Production Key"
 *                 environment:
 *                   type: string
 *                   example: "PRODUCTION"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-15T10:30:00Z"
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-05-15T10:30:00Z"
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *                 scopes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["api-key:create", "api-key:read"]
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized (invalid or missing JWT/session)
 *       403:
 *         description: Forbidden (missing required scope)
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.post("/createapikey", (0, apikey_middleware_1.requireScopes)(["api-key:create"]), controller.createApiKey);
/**
 * @swagger
 * /api/v1/apikey/verify:
 *   post:
 *     summary: Verify an API key
 *     description: |
 *       Checks the validity, environment, and status of an API key.
 *       Returns detailed information about the key's permissions and state.
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *             properties:
 *               apiKey:
 *                 type: string
 *                 minLength: 32
 *                 example: "sk_prod_1234567890abcdef1234567890abcdef"
 *                 description: The API key to verify
 *               expectedEnv:
 *                 type: string
 *                 enum: [DEVELOPMENT, PRODUCTION]
 *                 example: "PRODUCTION"
 *                 description: (Optional) Expected environment for this key
 *     responses:
 *       200:
 *         description: API key verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                   example: true
 *                   description: Whether the key is syntactically valid
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *                   description: Whether the key is currently active
 *                 isExpired:
 *                   type: boolean
 *                   example: false
 *                   description: Whether the key has expired
 *                 environment:
 *                   type: string
 *                   enum: [DEVELOPMENT, PRODUCTION]
 *                   example: "PRODUCTION"
 *                   description: The environment this API key is scoped to
 *                 userId:
 *                   type: string
 *                   example: "user_1234567890"
 *                   description: The user ID associated with this key
 *                 scopes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["api-key:create", "api-key:read"]
 *                 name:
 *                   type: string
 *                   example: "My Production Key"
 *       400:
 *         description: Invalid request payload
 *       500:
 *         description: Internal server error
 */
router.post("/verify", controller.verifyApiKey);
/**
 * @swagger
 * /api/v1/apikey/apikeys:
 *   get:
 *     summary: List API keys
 *     description: |
 *       Returns all API keys for the authenticated user.
 *       The response never includes the raw key values.
 *     tags: [API Keys]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of keys to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of keys to skip
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active/inactive status
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "My Production Key"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-04-15T10:30:00Z"
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-05-15T10:30:00Z"
 *                   lastUsed:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-04-20T15:45:00Z"
 *                   isActive:
 *                     type: boolean
 *                     example: true
 *                   scopes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["api-key:create", "api-key:read"]
 *       401:
 *         description: Unauthorized (invalid or missing API key)
 *       403:
 *         description: Forbidden (missing required scope)
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.get("/apikeys", (0, apikey_middleware_1.requireScopes)(["api-key:read", "api-key:create"]), controller.listApiKeys);
/**
 * @swagger
 * /api/v1/apikey/{keyId}:
 *   delete:
 *     summary: Revoke an API key
 *     description: |
 *       Immediately revokes an API key by marking it as inactive.
 *       The key will no longer be usable for authentication.
 *     tags: [API Keys]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The hashed key ID to revoke
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "API key revoked successfully"
 *       401:
 *         description: Unauthorized (invalid or missing API key)
 *       403:
 *         description: Forbidden (missing required scope or not key owner)
 *       404:
 *         description: API key not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.delete("/:keyId", (0, apikey_middleware_1.requireScopes)(["api-key:delete", "api-key:create"]), controller.revokeApiKey);
/**
 * @swagger
 * /api/v1/apikey/{keyId}:
 *   patch:
 *     summary: Update an API key
 *     description: |
 *       Updates metadata for an existing API key.
 *       Only certain fields can be modified after creation.
 *     tags: [API Keys]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The hashed key ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "Updated Key Name"
 *                 description: New name for the API key
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: Set to false to deactivate the key
 *     responses:
 *       200:
 *         description: API key updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Updated Key Name"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-15T10:30:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-20T15:45:00Z"
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-05-15T10:30:00Z"
 *                 lastUsed:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-20T15:45:00Z"
 *                 isActive:
 *                   type: boolean
 *                   example: false
 *                 scopes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["api-key:create", "api-key:read"]
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized (invalid or missing API key)
 *       403:
 *         description: Forbidden (missing required scope or not key owner)
 *       404:
 *         description: API key not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.patch("/:keyId", (0, apikey_middleware_1.requireScopes)(["api-key:update", "api-key:create"]), controller.updateApiKey);
exports.default = router;
