import { Request } from 'express';

import { JwtPayload } from '../modules/auth/types/auth.types';
import { Role } from '@prisma/client';

import { z } from 'zod';

export const PdfRequestSchema = z.object({
    id: z.string().min(1),
    description: z.string().min(1)
});

export type PdfRequest = z.infer<typeof PdfRequestSchema>;

// Add Swagger components
declare global {
    namespace OpenAPIV3 {
        export interface Components {
            schemas: {
                PdfRequest: typeof PdfRequestSchema;
            };
        }
    }
}


interface User {
  id: string;
  sub: string;
  email: string;
  roles: string[]; 
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

declare global {
    namespace NodeJS {
      interface ProcessEnv extends EnvConfig {}
    }
  }


declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        scopes: string[];
        id: string;
        email: string;
        roles: Role
      };
    }
  }
}


declare global {
    namespace Express {
      interface Request {
        user?: {
          sub: string;
          id: string;
          email: string;
          roles: Role; // Add roles array
        };
      }
    }
  }