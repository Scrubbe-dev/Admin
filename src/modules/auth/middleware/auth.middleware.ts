import { Request, Response, NextFunction } from "express";
import { TokenService } from "../services/token.service";
import { UnauthorizedError, ForbiddenError } from "../error";
import { AccountType, Role, User } from "../types/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sub: string;
        email: string;
        accountType?: AccountType;
        scopes?: string[];
      };
    }
  }
}

export class AuthMiddleware {
  constructor(private tokenService: TokenService) {}

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication required");
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      req.user = payload as any;
      next();
    } catch (err) {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  };

  authorize = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const hasRequiredRole = roles.some((role) =>
        (
          req.user as {
            id: string;
            sub: string;
            email: string;
            roles: string[];
          }
        ).roles.includes(role)
      );
      if (!hasRequiredRole) {
        throw new ForbiddenError("Insufficient permissions");
      }

      next();
    };
  };
}
