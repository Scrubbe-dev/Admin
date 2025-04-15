export interface ApiKey {
    key: string;
    version: number;
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