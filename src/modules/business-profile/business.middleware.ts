import { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../auth/error";

export const businessAccountOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.accountType === "BUSINESS") {
    return next();
  }

  throw new ForbiddenError("Access restricted to business accounts only");
};

// export const mustBeAMember = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (req.user && req.user.)
// };
