import { OAuthProvider } from "@prisma/client";
import { AccountType } from "@prisma/client";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  isVerified: boolean;
  accountType: AccountType;
  scopes: string[];
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
};

export interface MappedUser {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    businessId?: string;
    accountType: AccountType | null;
  };
  tokens: Tokens;
}

export type VerifyEmailRequest = {
  userId: string;
  code: string;
};

export type ResendOtpRequest = {
  userId: string;
};

// export enum AccountType {
//   DEVELOPER = "DEVELOPER",
//   BUSINESS = "BUSINESS",
// }

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string; // User ID
  email: string;
  firstName:string;
  lastName:string;
  accountType: string;
  businessId?: string;
  scopes: string[];
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
  githubUsername?: string;
  experienceLevel: string;
};

export type RegisterBusinessRequest = {
  firstName: string;
  lastName: string;
  email: string;
  businessAddress?: string;
  companySize: string;
  purpose?: string;
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

export interface OAuthBusinesRequest {
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  image?: string;
  id: string; // oauthproviderid
  oAuthProvider: OAuthProviders;

  businessAddress?: string;
  companySize: string;
  purpose?: string;
}

export interface OAuthLoginRequest {
  email: string;
  provider_uuid: string;
  oAuthProvider: OAuthProvider;
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


export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};



// Add to existing types
export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  password: string;
};

export type ValidateResetTokenInput = {
  token: string;
};