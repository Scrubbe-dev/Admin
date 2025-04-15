import { Request, Response } from 'express';
import { ApiKeyService } from './apikey.service';
import { 
  CreateApiKeyPayload, 
  ApiKeyResponse, 
  ApiKeyFilter 
} from './apikey.types';
import { 
  createApiKeySchema, 
  verifyApiKeySchema, 
  listApiKeysSchema,
  updateApiKeySchema 
} from './apikey.schema';

const apiKeyService = new ApiKeyService();

export class ApiKeyController {
  async createApiKey(req: Request, res: Response) {
    const validation = createApiKeySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: validation.error.errors 
      });
    }

    try {
      const payload: CreateApiKeyPayload = {
        ...validation.data,
        userId: req.user!.id, // From auth middleware
      };

      const apiKey = await apiKeyService.createApiKey(payload);
      
      // Format the response
      const response: ApiKeyResponse = {
        key: apiKey.key, // This is the only time the raw key is returned
        name: String(apiKey.metadata.name),
        createdAt: apiKey.metadata.createdAt as Date,
        expiresAt: apiKey.metadata.expiresAt,
        isActive: apiKey.metadata.isActive as boolean,
        scopes: apiKey.scopes,
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error('Error creating API key:', error);
      return res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  async verifyApiKey(req: Request, res: Response) {
    const validation = verifyApiKeySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: validation.error.errors 
      });
    }

    try {
      const verification = await apiKeyService.verifyApiKey(validation.data.apiKey);
      return res.status(200).json(verification);
    } catch (error) {
      console.error('Error verifying API key:', error);
      return res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  async listApiKeys(req: Request, res: Response) {
    const validation = listApiKeysSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: validation.error.errors 
      });
    }

    try {
      const filter: ApiKeyFilter = {
        isActive: validation.data.isActive,
      };

      const apiKeys = await apiKeyService.listApiKeys(req.user!.id, filter);
      
      // Don't expose hashed keys or internal metadata
      const response = apiKeys.map(key => ({
        name: key.metadata.name,
        createdAt: key.metadata.createdAt,
        expiresAt: key.metadata.expiresAt,
        lastUsed: key.metadata.lastUsed,
        isActive: key.metadata.isActive,
        scopes: key.scopes,
      }));

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error listing API keys:', error);
      return res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  async revokeApiKey(req: Request, res: Response) {
    const { keyId } = req.params;
    
    if (!keyId) {
      return res.status(400).json({ 
        error: 'Key ID is required' 
      });
    }

    try {
      const success = await apiKeyService.revokeApiKey(keyId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ 
          error: 'API key not found or not owned by user' 
        });
      }

      return res.status(200).json({ 
        message: 'API key revoked successfully' 
      });
    } catch (error) {
      console.error('Error revoking API key:', error);
      return res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  async updateApiKey(req: Request, res: Response) {
    const { keyId } = req.params;
    const validation = updateApiKeySchema.safeParse(req.body);
    
    if (!keyId) {
      return res.status(400).json({ 
        error: 'Key ID is required' 
      });
    }

    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: validation.error.errors 
      });
    }

    try {
      const updates = validation.data;
      const updatedKey = await apiKeyService.updateApiKey(keyId, req.user!.id, {
        metadata: updates,
      });
      
      if (!updatedKey) {
        return res.status(404).json({ 
          error: 'API key not found or not owned by user' 
        });
      }

      // Format the response
      const response = {
        name: updatedKey.metadata.name,
        createdAt: updatedKey.metadata.createdAt,
        updatedAt: updatedKey.metadata.updatedAt,
        expiresAt: updatedKey.metadata.expiresAt,
        lastUsed: updatedKey.metadata.lastUsed,
        isActive: updatedKey.metadata.isActive,
        scopes: updatedKey.scopes,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error updating API key:', error);
      return res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }
}