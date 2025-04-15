import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiKeyService } from './apikey.service';
import { AuthenticatedRequest, VerifyApiKeyResponse } from './apikey.types';

const apiKeyService = new ApiKeyService();

export async function apiKeyAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ 
      error: 'API key is required' 
    });
  }

  const verification = await apiKeyService.verifyApiKey(apiKey);

  if (!verification.isValid) {
    return res.status(401).json({ 
      error: 'Invalid API key' 
    });
  }

  if (!verification.isActive) {
    return res.status(403).json({ 
      error: verification.isExpired ? 'API key has expired' : 'API key is inactive' 
    });
  }

  // Attach user and scopes to the request for downstream use
  req.user = {
    id: verification.userId!,
    scopes: verification.scopes || [],
  };

  next();
}

export function requireScope(scope: string): RequestHandler | void | unknown {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.user.scopes.includes(scope)) {
      return res.status(403).json({ 
        error: `Insufficient permissions. Required scope: ${scope}` 
      });
    }

    return next();
  };
}