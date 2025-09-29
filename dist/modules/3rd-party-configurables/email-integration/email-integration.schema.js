"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailIntegrationSchema = void 0;
const zod_1 = require("zod");
exports.emailIntegrationSchema = zod_1.z.object({
    subdomain: zod_1.z
        .string()
        .min(3, "Subdomain must be at least 3 characters")
        .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
});
