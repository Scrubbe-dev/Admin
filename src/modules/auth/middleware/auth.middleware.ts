import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { UnauthorizedError, ForbiddenError } from '../error';
import { Role } from '../types/auth.types';

export class AuthMiddleware {
  constructor(private tokenService: TokenService) {}

  authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.tokenService.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  };

  authorize = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const hasRequiredRole = roles.some(role => req.user?.roles.includes(role));
      if (!hasRequiredRole) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    };
  };
}