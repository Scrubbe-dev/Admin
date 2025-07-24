import { OAuthProvider } from "@prisma/client";
import { z } from "zod";

const freeEmailDomains: string[] = [
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
const emailSchema = z.string().email("Invalid email address").max(255);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
    `Password must contain at least one uppercase letter,
     one lowercase letter, one number, and one special character`
  );

export const businessEmailSchema = z
  .string()
  .email("Invalid email address")
  .max(255)
  .refine(
    (email) => {
      const domain = email.split("@")[1].toLowerCase();
      return !freeEmailDomains.includes(domain);
    },
    {
      message: "Email must be a business email address",
    }
  );

// Register dev schema
export const registerDevSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  experienceLevel: z.string().min(1, "Experience is required"),
  githubUsername: z
    .string()
    .min(1, "Please provide a valid github username")
    .optional(),
  email: emailSchema,
  password: passwordSchema,
});

// register by Oauth
export const registerDevByOauth = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  id: z.string({ required_error: "Auth provider id is required" }).uuid(),
  oAuthProvider: z.nativeEnum(OAuthProvider, {
    invalid_type_error: "Invalid OAuth provider",
  }),
  email: emailSchema,
});

// register busines by Oauth
export const registerBusinessByOauth = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  id: z.string({ required_error: "Auth provider id is required" }).uuid(),
  oAuthProvider: z.nativeEnum(OAuthProvider, {
    invalid_type_error: "Invalid OAuth provider",
  }),
  email: businessEmailSchema,

  businessAddress: z.string().min(10, "Please provide a valid address"),
  companySize: z.string().min(1, "Company size is required"),
  purpose: z.string().min(1, "Purpose is required"),
});

// Register business schema
export const registerBusinessSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: businessEmailSchema,
  password: passwordSchema,
  businessAddress: z.string().min(10, "Please provide a valid address"),
  companySize: z.string().min(1, "Company size is required"),
  purpose: z.string().min(1, "Purpose is required"),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Login with oauth schema
export const loginWithOauthSchema = z.object({
  email: emailSchema,
  provider_uuid: z
    .string({ required_error: "Auth provider id is required" })
    .uuid(),
  oAuthProvider: z.nativeEnum(OAuthProvider, {
    invalid_type_error: "Invalid OAuth provider",
  }),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

// Verify email schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const verifyOTPSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  code: z.string().min(4, "OTP code is required"),
});

// Export all schemas
export const authSchemas = {
  register: registerDevSchema,
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  verifyEmail: verifyEmailSchema,
  changePassword: changePasswordSchema,
  verifyOTP: verifyOTPSchema,
};

// Type exports
export type RegisterDevRequest = z.infer<typeof registerDevSchema>;
export type OAuthLoginRequest = z.infer<typeof loginWithOauthSchema>;
export type RegisterByOAth = z.infer<typeof registerDevByOauth>;
export type RegisterBusinessByOAth = z.infer<typeof registerBusinessByOauth>;
export type RegisterBusinessRequest = z.infer<typeof registerBusinessSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
