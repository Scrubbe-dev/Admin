import { Request, Response, NextFunction } from "express";
import { TokenService } from "../services/token.service";
import { UnauthorizedError, ForbiddenError } from "../error";
import { Role, User } from "../types/auth.types";
import { AccountType } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sub: string;
        firstName:string;
        lastName:string;
        email: string;
        accountType?: AccountType;
        businessId?: string;
        scopes?: string[];
      };
    }
  }
}

export class AuthMiddleware {
  constructor(private tokenService: TokenService) {}

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Authentication required");
      }

      const token = authHeader.split(" ")[1];
      const payload = await this.tokenService.verifyAccessToken(token);

      req.user = payload as any;

      console.log("=========== REQ.USER ===========", req.user);
      next();
    } catch (err) {
      next(err);
    }
  };

  authorize = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const hasRequiredRole = roles.some((role) =>
        (
          req.user as any
        ).roles.includes(role)
      );
      if (!hasRequiredRole) {
        throw new ForbiddenError("Insufficient permissions");
      }

      next();
    };
  };
}
