import jwt from 'jsonwebtoken';

export class JWTUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '7d';
  private static readonly CUSTOMER_JWT_EXPIRES_IN = '30d';

  // Existing user token methods
  static generateToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): { id: string; email: string; role: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as any;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Customer-specific token methods
  static generateCustomerToken(payload: { id: string; email: string; companyUserId: string; name: string }): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.CUSTOMER_JWT_EXPIRES_IN });
  }

  static verifyCustomerToken(token: string): { id: string; email: string; companyUserId: string; name: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as any;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}