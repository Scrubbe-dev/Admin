export enum Environment {
  DEVELOPMENT = "DEVELOPMENT",
  PRODUCTION = "PRODUCTION",
}

export interface ApiKey {
  key: string;
  version: number;
  environment: Environment;
  metadata: {
    name?: string;
    userId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    expiresAt?: Date;
    lastUsed?: Date;
    isActive?: boolean;
  };
  scopes: string[];
}

export interface CreateApiKeyPayload {
  environment: Environment;
  name: string;
  userId: string;
  expiresInDays?: number;
  scopes?: string[];
}

export interface VerifyApiKeyResponse {
  isValid: boolean;
  isActive: boolean;
  isExpired: boolean;
  userId?: string;
  scopes?: string[];
  name?: string;
}

export interface ApiKeyResponse {
  key: string;
  environment: Environment;
  name: string;
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  isActive: boolean;
  scopes: string[];
}

export interface ApiKeyFilter {
  userId?: string;
  isActive?: boolean;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    scopes: string[];
  };
}
