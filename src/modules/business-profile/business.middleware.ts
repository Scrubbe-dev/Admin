import { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../auth/error";

export const businessAccountOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("=============================================================Business account middleware triggered=============================================================");
  console.log("=============================================================Req.User=============================================================", req.user);
  if (req.user && req.user.AccountType === "BUSINESS") {
    return next();
  }

  throw new ForbiddenError("Access restricted to business accounts only");
};
