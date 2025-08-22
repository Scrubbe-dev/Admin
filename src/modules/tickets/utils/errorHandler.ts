import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from './apiResponse';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return ApiResponse.validationError(res, [err.message]);
  }
  
  if (err.name === 'NotFoundError') {
    return ApiResponse.notFound(res, err.message);
  }
  
  return ApiResponse.error(res, 'Internal server error');
};