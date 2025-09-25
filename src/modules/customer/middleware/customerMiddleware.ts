import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { ApiResponse } from '../types';

export const authenticateCustomer = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    const response: ApiResponse = {
      success: false,
      message: 'Access token required'
    };
    return res.status(401).json(response);
  }

  try {
    const customer = JWTUtils.verifyCustomerToken(token);
    req.customer = customer;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid or expired token'
    };
    return res.status(403).json(response);
  }
};

export const authorizeCustomer = (req: any, res: Response, next: NextFunction) => {
  if (!req.customer || !req.customer.id) {
    const response: ApiResponse = {
      success: false,
      message: 'Customer authorization required'
    };
    return res.status(403).json(response);
  }
  next();
};