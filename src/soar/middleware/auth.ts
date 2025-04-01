
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../app';
import { CustomError } from '../../utils/customError';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        customerId?: string;
      };
      id?: string; // Request ID for tracing
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      throw new CustomError(
        'Authentication required',
        401,
        'UNAUTHORIZED',
        { reason: 'Missing authentication token' }
      );
    }

    if (authHeader.startsWith('Bearer ')) {
      // JWT token authentication
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'scrubbe_default_secret'
        ) as {
          id: string;
          email: string;
          role: string;
          customerId?: string;
        };

        // Check if user exists and is active
        const user = await prisma.user.findFirst({
          where: {
            id: decoded.id,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            role: true,
            customerId: true,
          },
        });

        if (!user) {
          throw new CustomError(
            'User not found or inactive',
            401,
            'UNAUTHORIZED',
            { reason: 'User account issue' }
          );
        }

        // Update last login time silently (don't wait for it)
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch((err:any) => console.error('Failed to update last login time:', err));

        req.user = user;
        next();
      } catch (error) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new CustomError(
          'Invalid or expired token',
          401,
          'UNAUTHORIZED',
          { reason: 'Token validation failed' }
        );
      }
    } else if (authHeader.startsWith('ApiKey ')) {
      // API key authentication
      const apiKey = authHeader.replace('ApiKey ', '');
      
      const customer = await prisma.customer.findUnique({
        where: { apiKey, status: 'ACTIVE' },
        select: {
          id: true,
          users: {
            where: { role: 'CUSTOMER', isActive: true },
            select: {
              id: true,
              email: true,
              role: true,
            },
            take: 1,
          },
        },
      });

      if (!customer || customer.users.length === 0) {
        throw new CustomError(
          'Invalid API key or inactive customer',
          401,
          'UNAUTHORIZED',
          { reason: 'API key validation failed' }
        );
      }

      const user = customer.users[0];
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: customer.id,
      };
      next();
    } else {
      throw new CustomError(
        'Unsupported authentication method',
        401,
        'UNAUTHORIZED',
        { reason: 'Invalid authentication format' }
      );
    }
  } catch (error) {
    next(error);
  }
};

// Role-based access control middleware
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError(
          'Authentication required',
          401,
          'UNAUTHORIZED',
          { reason: 'User not authenticated' }
        );
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new CustomError(
          'Insufficient permissions',
          403,
          'FORBIDDEN',
          { reason: 'Role not authorized', requiredRoles: allowedRoles }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has permission to access customer data
export const authorizeCustomerAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new CustomError(
        'Authentication required',
        401,
        'UNAUTHORIZED',
        { reason: 'User not authenticated' }
      );
    }

    const requestedCustomerId = req.params.customerId || req.body.customerId;
    
    // Admins and managers can access any customer
    if (['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return next();
    }
    
    // Customers can only access their own data
    if (req.user.role === 'CUSTOMER' && req.user.customerId !== requestedCustomerId) {
      throw new CustomError(
        'Insufficient permissions',
        403,
        'FORBIDDEN',
        { reason: 'Cannot access other customer data' }
      );
    }

    // Analysts can only access certain customer data if assigned
    if (req.user.role === 'ANALYST') {
      // Logic for analyst permissions could be more complex
      // e.g., checking if analyst is assigned to any incidents for this customer
    }

    next();
  } catch (error) {
    next(error);
  }
};

