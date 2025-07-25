import { Request, Response, NextFunction } from "express";
import {
  AppError,
  NotFoundError,
  ValidationError,
} from "../modules/auth/error";
import { logger } from "../common/logger/logger";

/**
 * Error handling middleware for Express applications
 * @param err The error object
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): string | unknown {
  // Handle specific error types
  if (err instanceof AppError) {
    const statusCode = err.statusCode || 500;
    const response = {
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
    };

    // Log client errors (4xx) as warnings, server errors (5xx) as errors
    if (statusCode >= 400 && statusCode < 500) {
      logger.warn(
        `Client error: ${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    } else {
      logger.error(
        `Server error: ${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
        err.stack
      );
    }

    return res.status(statusCode).json(response);
  }

  // Handle mongoose validation errors
  if (err.name === "ValidationError") {
    const validationError = new ValidationError("Validation failed", err);
    return errorHandler(validationError, req, res, next);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    const jwtError = new AppError("Invalid token", 401);
    return errorHandler(jwtError, req, res, next);
  }

  if (err.name === "TokenExpiredError") {
    const tokenExpiredError = new AppError("Token expired", 401);
    return errorHandler(tokenExpiredError, req, res, next);
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    // Provide actual Prisma error message and details
    const prismaError = new AppError(err.message || "Database error", 400, err);
    return errorHandler(prismaError, req, res, next);
  }

  // Handle 404 errors
  if (err instanceof NotFoundError) {
    return errorHandler(err, req, res, next);
  }

  // Log unexpected errors
  logger.error(
    `Unexpected error: ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    err.stack
  );

  // Default to 500 server error for unhandled cases
  const unexpectedError = new AppError(err.message || "Internal server error", 500);
  res.status(500).json({
    status: "error",
    message: unexpectedError.message,
  });

  // In development, include the error stack trace
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }
}

/**
 * Middleware to catch 404 errors and forward to error handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = new NotFoundError(`Not found - ${req.originalUrl}`);
  next(error);
}
