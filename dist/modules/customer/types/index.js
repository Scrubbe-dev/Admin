"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerIncidentsSchema = exports.createCustomerIncidentSchema = exports.customerRegisterSchema = exports.customerLoginSchema = void 0;
const zod_1 = require("zod");
// Auth Types
exports.customerLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Please enter a valid email address" }),
    password: zod_1.z.string().min(6, { message: "Password must be at least 6 characters" })
});
exports.customerRegisterSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, { message: "Full name is required" }),
    companyName: zod_1.z.string().min(1, { message: "Company name is required" }).optional(),
    email: zod_1.z.string().email({ message: "Please enter a valid email address" }),
    password: zod_1.z.string().min(6, { message: "Password must be at least 6 characters" }),
    companyUserId: zod_1.z.string().uuid({ message: "Valid company user ID is required" }) // The User (Flutterwave) they're registering for
});
// Customer Portal Incident Types
exports.createCustomerIncidentSchema = zod_1.z.object({
    shortDescription: zod_1.z.string().min(1, { message: "Short description is required" }),
    description: zod_1.z.string().min(1, { message: "Description is required" }),
    priority: zod_1.z.enum(["Low", "Medium", "High", "Critical"]),
    category: zod_1.z.string().min(1, { message: "Category is required" })
});
exports.getCustomerIncidentsSchema = zod_1.z.object({
    page: zod_1.z.number().min(1).optional().default(1),
    limit: zod_1.z.number().min(1).max(100).optional().default(10),
    status: zod_1.z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional()
});
