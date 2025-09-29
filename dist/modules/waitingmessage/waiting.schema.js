"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWaitingUsersSchema = exports.createWaitingUserSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const roleEnum = zod_1.z.nativeEnum(client_1.Roles);
exports.createWaitingUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email address'),
        company: zod_1.z.string().min(2, 'Company name must be at least 2 characters'),
        role: zod_1.z.string(),
        message: zod_1.z.string().max(500, 'Message cannot exceed 500 characters').optional()
    })
});
exports.getWaitingUsersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional().default('1').transform(Number),
        limit: zod_1.z.string().regex(/^\d+$/).optional().default('10').transform(Number),
        role: roleEnum.optional(),
        search: zod_1.z.string().optional()
    })
});
