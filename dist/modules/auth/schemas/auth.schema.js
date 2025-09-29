"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSchemas = exports.validateResetTokenSchema = exports.verifyOTPSchema = exports.changePasswordSchema = exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginWithOauthSchema = exports.loginSchema = exports.registerBusinessSchema = exports.registerBusinessByOauth = exports.registerDevByOauth = exports.registerDevSchema = exports.businessEmailSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const validation_schema_1 = require("../../../shared/validation/validation.schema");
const freeEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "mail.com",
    "gmx.com",
    "protonmail.com",
    "zoho.com",
    "yandex.com",
    "msn.com",
    "live.com",
    "ymail.com",
    "inbox.com",
    "me.com",
];
// Common schemas
const passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, `Password must contain at least one uppercase letter,
     one lowercase letter, one number, and one special character`);
exports.businessEmailSchema = zod_1.z
    .string()
    .email("Invalid email address")
    .max(255)
    .refine((email) => {
    const domain = email.split("@")[1].toLowerCase();
    return !freeEmailDomains.includes(domain);
}, {
    message: "Email must be a business email address",
});
// Register dev schema
exports.registerDevSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    experienceLevel: zod_1.z.string().min(1, "Experience is required"),
    githubUsername: zod_1.z
        .string()
        .min(1, "Please provide a valid github username")
        .optional(),
    email: validation_schema_1.emailSchema,
    password: passwordSchema,
});
// register by Oauth
exports.registerDevByOauth = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    id: zod_1.z.string({ required_error: "Auth provider id is required" }).uuid(),
    oAuthProvider: zod_1.z.nativeEnum(client_1.OAuthProvider, {
        invalid_type_error: "Invalid OAuth provider",
    }),
    email: validation_schema_1.emailSchema,
});
// register busines by Oauth
exports.registerBusinessByOauth = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    id: zod_1.z.string({ required_error: "Auth provider id is required" }).uuid(),
    oAuthProvider: zod_1.z.nativeEnum(client_1.OAuthProvider, {
        invalid_type_error: "Invalid OAuth provider",
    }),
    email: exports.businessEmailSchema,
    businessAddress: zod_1.z.string().min(10, "Please provide a valid address"),
    companySize: zod_1.z.string().min(1, "Company size is required"),
    purpose: zod_1.z.string().min(1, "Purpose is required"),
});
// Register business schema
exports.registerBusinessSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
    email: exports.businessEmailSchema,
    password: passwordSchema,
    businessAddress: zod_1.z.string().min(10, "Please provide a valid address"),
    companySize: zod_1.z.string().min(1, "Company size is required"),
    purpose: zod_1.z.string().min(1, "Purpose is required"),
});
// Login schema
exports.loginSchema = zod_1.z.object({
    email: validation_schema_1.emailSchema,
    password: zod_1.z.string().min(1, "Password is required"),
});
// Login with oauth schema
exports.loginWithOauthSchema = zod_1.z.object({
    email: validation_schema_1.emailSchema,
    provider_uuid: zod_1.z
        .string({ required_error: "Auth provider id is required" })
        .uuid(),
    oAuthProvider: zod_1.z.nativeEnum(client_1.OAuthProvider, {
        invalid_type_error: "Invalid OAuth provider",
    }),
});
// Refresh token schema
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
// Forgot password schema
exports.forgotPasswordSchema = zod_1.z.object({
    email: validation_schema_1.emailSchema,
});
// Reset password schema
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Token is required"),
    password: passwordSchema,
});
// Verify email schema
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Token is required"),
});
// Change password schema
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
});
exports.verifyOTPSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid user ID"),
    code: zod_1.z.string().min(4, "OTP code is required"),
});
exports.validateResetTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
});
// Export all schemas
exports.authSchemas = {
    register: exports.registerDevSchema,
    login: exports.loginSchema,
    refreshToken: exports.refreshTokenSchema,
    forgotPassword: exports.forgotPasswordSchema,
    resetPassword: exports.resetPasswordSchema,
    validateResetTokenSchema: exports.validateResetTokenSchema,
    verifyEmail: exports.verifyEmailSchema,
    changePassword: exports.changePasswordSchema,
    verifyOTP: exports.verifyOTPSchema,
};
