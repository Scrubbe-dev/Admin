export class AppError extends Error {
    constructor(
      public message: string,
      public statusCode: number = 500,
      public details?: any
    ) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
      super(message, 404);
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
      super(message, 401);
    }
  }
  
  export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
      super(message, 403);
    }
  }
  
  export class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
      super(message, 409);
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: any) {
      super(message, 422, details);
    }
  }