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

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  experience?: string;
};

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
