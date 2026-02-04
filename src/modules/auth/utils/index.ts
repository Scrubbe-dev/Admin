import { Request } from "express";
import { AccountType } from "@prisma/client";
import { Role } from "../types/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sub: string;
        firstName: string;
        lastName: string;
        email: string;
        accountType?: AccountType;
        businessId?: string;
        scopes?: string[];
        roles?: Role[];
      };
    }
  }
}

export function getUserId(req: Request): string | undefined {
  return req?.user?.id;
}

