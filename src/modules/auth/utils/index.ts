import {Request} from 'express'
import { AccountType } from "@prisma/client";

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
      };
    }
  }
}

export function getUserId(req: Request): string | undefined {
  return req?.user?.id;
}

