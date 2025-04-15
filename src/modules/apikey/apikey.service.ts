import { v4 as uuidv4 } from 'uuid';
import { createHash, randomBytes } from 'crypto';
import { ApiKey, CreateApiKeyPayload, VerifyApiKeyResponse, ApiKeyFilter } from './apikey.types';

// In a production environment, you would use a database
const API_KEYS: Record<string, ApiKey> = {};

export class ApiKeyService {
  private generateApiKey(): string {
    const prefix = 'sk_';
    const randomPart = randomBytes(16).toString('hex');
    const uniquePart = uuidv4().replace(/-/g, '');
    return `${prefix}${randomPart}${uniquePart}`.slice(0, 64);
  }

  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async createApiKey(payload: CreateApiKeyPayload): Promise<ApiKey> {
    const rawKey = this.generateApiKey();
    const hashedKey = this.hashApiKey(rawKey);
    
    const expiresAt = payload.expiresInDays 
      ? new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKey: ApiKey = {
      key: hashedKey,
      version: 1,
      metadata: {
        name: payload.name,
        userId: payload.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt,
        isActive: true,
      },
      scopes: payload.scopes || ['default'],
    };

    API_KEYS[hashedKey] = apiKey;

    // Return the raw key only once - it should never be stored or shown again
    return {
      ...apiKey,
      key: rawKey,
    };
  }

  async verifyApiKey(apiKey: string): Promise<VerifyApiKeyResponse> {
    const hashedKey = this.hashApiKey(apiKey);
    const storedKey = API_KEYS[hashedKey];

    if (!storedKey) {
      return {
        isValid: false,
        isActive: false,
        isExpired: false,
      };
    }

    // Update last used timestamp
    storedKey.metadata.lastUsed = new Date();
    API_KEYS[hashedKey] = storedKey;

    const isExpired = storedKey.metadata.expiresAt 
      ? new Date() > storedKey.metadata.expiresAt
      : false;

    return {
      isValid: true,
      isActive: storedKey.metadata.isActive as boolean && !isExpired,
      isExpired,
      userId: storedKey.metadata.userId,
      scopes: storedKey.scopes,
      name: storedKey.metadata.name,
    };
  }

  async listApiKeys(userId: string, filter: ApiKeyFilter = {}): Promise<ApiKey[]> {
    return Object.values(API_KEYS)
      .filter(key => key.metadata.userId === userId)
      .filter(key => filter.isActive === undefined || key.metadata.isActive === filter.isActive)
      .filter(key => !filter.name || key.metadata.name?.includes(filter.name));
  }

  async revokeApiKey(hashedKey: string, userId: string): Promise<boolean> {
    const key = API_KEYS[hashedKey];
    
    if (!key || key.metadata.userId !== userId) {
      return false;
    }

    key.metadata.isActive = false;
    key.metadata.updatedAt = new Date();
    API_KEYS[hashedKey] = key;
    
    return true;
  }

  async updateApiKey(hashedKey: string, userId: string, updates: Partial<ApiKey>): Promise<ApiKey | null> {
    const key = API_KEYS[hashedKey];
    
    if (!key || key.metadata.userId !== userId) {
      return null;
    }

    const updatedKey = {
      ...key,
      ...updates,
      metadata: {
        ...key.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
      },
    };

    API_KEYS[hashedKey] = updatedKey;
    return updatedKey;
  }
}