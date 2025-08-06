import { AccountType } from './../auth/types/auth.types';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './admin.utils';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sub: string;
        email: string;
        accountType?: AccountType;
        businessId?: string;
        scopes?: string[]
      };
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id:string; sub: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const adminGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ApiError(403, 'Forbidden - admin access required'));
  }
  next();
};