export class AuthenticationError extends Error {
    code = 'AUTH_FAILURE';
    statusCode = 401;
  
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }
  
  export class FraudDetectionError extends Error {
    code = 'FRAUD_FLAGGED';
    statusCode = 403;
  
    constructor(public riskScore: number) {
      super(`High-risk activity detected (score: ${riskScore})`);
      this.name = 'FraudDetectionError';
    }
  }