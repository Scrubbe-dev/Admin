"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApiKeySchema = exports.listApiKeysSchema = exports.verifyApiKeySchema = exports.createApiKeySchema = void 0;
const apikey_types_1 = require("./apikey.types");
const zod_1 = require("zod");
exports.createApiKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(50),
    expiresInDays: zod_1.z.number().int().min(1).max(365).optional(),
    scopes: zod_1.z.array(zod_1.z.string()).optional(),
    environment: zod_1.z.enum([apikey_types_1.Environment.DEVELOPMENT, apikey_types_1.Environment.PRODUCTION]),
});
exports.verifyApiKeySchema = zod_1.z.object({
    apiKey: zod_1.z.string().min(32),
    expectedEnv: zod_1.z
        .enum([apikey_types_1.Environment.DEVELOPMENT, apikey_types_1.Environment.PRODUCTION])
        .optional(),
});
exports.listApiKeysSchema = zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(100).default(10),
    offset: zod_1.z.number().int().min(0).default(0),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateApiKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(50).optional(),
    isActive: zod_1.z.boolean().optional(),
});
