export class ErrorUtil {
  /**
   * Create standardized error response
   */
  static createErrorResponse(message: string, errors?: string[]) {
    return {
      success: false,
      message,
      errors: errors || [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log error with context
   */
  static logError(context: string, error: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${context}:`, {
      message: error.message,
      stack: error.stack,
      ...error
    });
  }
}