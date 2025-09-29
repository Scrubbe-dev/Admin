"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRequestSchema = void 0;
const zod_1 = require("zod");
exports.emailRequestSchema = zod_1.z.object({
    senderEmail: zod_1.z.string().email(),
    displayName: zod_1.z.string().min(1),
    subject: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    legitimateDomains: zod_1.z.array(zod_1.z.string().url()).optional(),
});
