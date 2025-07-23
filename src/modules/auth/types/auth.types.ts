import { OAuthProvider } from "@prisma/client";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  isVerified: boolean;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
};

export type VerifyEmailRequest = {
  userId: string;
  code: string;
};

export type ResendOtpRequest = {
  userId: string;
};

export enum AccountType {
  DEVELOPER,
  BUSINESS,
}

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string; // User ID
  email: string;
  roles: Role[];
  iat: number; // Issued at
  exp: number; // Expiration time
};

export type AuthResponse = {
  user: Omit<User, "passwordHash" | "refreshToken">;
  tokens: Tokens;
};

export type RegisterDevRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  githubUserame?: string;
  experienceLevel: string;
};

export type RegisterBusinessRequest = {
  firstName: string;
  lastName: string;
  email: string;
  businessAddress?: string;
  companySize: string;
  purpose: string;
  password: string;
};

export interface OAuthRequest {
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  image?: string;
  id: string;
  oAuthProvider: OAuthProviders;
}

export enum OAuthProviders {
  GOOGLE,
  AWS,
  GITHUB,
  // FIREFOX,
  GITLAB,
  AZURE,
}

export type LoginInput = {
  email: string;
  password: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  password: string;
};
