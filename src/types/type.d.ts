import { Request } from 'express';

import { JwtPayload } from '../auth/types/auth.types';

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
      };
    }
  }
}