declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        firstName:string;
        lastName:string;
        scopes: string[];
        id: string;
        email: string;
        roles: Role
      };
    }
  }
}