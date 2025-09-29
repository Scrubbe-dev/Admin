"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInviteSchema = exports.decodeInviteSchema = exports.businessSetUpSchema = exports.dashboardPreferenceSchema = exports.inviteMembersSchema = void 0;
const zod_1 = require("zod");
const validation_schema_1 = require("../../shared/validation/validation.schema");
const business_types_1 = require("./business.types");
const client_1 = require("@prisma/client");
exports.inviteMembersSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is not valid").optional(),
    lastName: zod_1.z.string().min(1, "Last name is not valid").optional(),
    inviteEmail: validation_schema_1.emailSchema,
    role: zod_1.z.nativeEnum(client_1.Role, {
        invalid_type_error: "Invalid role",
    }),
    accessPermissions: zod_1.z
        .array(zod_1.z.nativeEnum(business_types_1.AccessPermissions, {
        invalid_type_error: "Invalid Access permission",
    }))
        .min(1, "At least one access permission is required"),
});
exports.dashboardPreferenceSchema = zod_1.z.object({
    colorScheme: zod_1.z.string().min(1, "Color scheme is required"),
    defaultDashboard: zod_1.z.nativeEnum(business_types_1.DashboardType, {
        required_error: "Default dashboard is required",
        invalid_type_error: "Invalid dashboard type",
    }),
    preferredIntegration: zod_1.z.array(zod_1.z.nativeEnum(business_types_1.PrefferedIntegration, {
        required_error: "Preferred integration is required",
        invalid_type_error: "Invalid integration type",
    })),
    notificationChannels: zod_1.z
        .array(zod_1.z.nativeEnum(business_types_1.NotificationChannels, {
        invalid_type_error: "Invalid notification channel",
    }))
        .min(1, "At least one notification channel is required"),
    defaultPriority: zod_1.z.nativeEnum(client_1.Priority, {
        required_error: "Priority is required",
        invalid_type_error: "Invalid priority",
    }),
});
exports.businessSetUpSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1, "Company name is required"),
    industry: zod_1.z.string().min(1, "Industry is required"),
    companySize: zod_1.z.string().min(1, "Company size is required"),
    primaryRegion: zod_1.z.string().min(1, "Primary region is required"),
    companyLogo: zod_1.z.string().optional(),
    // Admin info
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    adminEmail: validation_schema_1.emailSchema,
    adminJobTitle: zod_1.z.string().min(1, "Job title is required"),
    // Invite team members (optional array)
    inviteMembers: zod_1.z
        .array(exports.inviteMembersSchema)
        .max(2, "Maximum of 2 invites are allowed")
        .optional(),
    dashboardPreference: exports.dashboardPreferenceSchema.optional(),
});
exports.decodeInviteSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Token is required")
});
// business.schema.ts
exports.acceptInviteSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
    businessId: zod_1.z.string().min(1, "Business ID is required")
});
