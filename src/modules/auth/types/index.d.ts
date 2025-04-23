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