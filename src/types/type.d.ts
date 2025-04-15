import { Request } from 'express';

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