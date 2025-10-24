import prisma from "../../prisma-clients/client";
import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../auth/error";
import { TokenService } from "../auth/services/token.service";
import {config} from "dotenv";
config();

const tokenService = new TokenService(
    process.env.JWT_SECRET!,
    process.env.JWT_EXPIRES_IN || "1h",
    15
);

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

// business.middleware.ts
export const mustBeAMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("User Info from Middleware:", req.user);
    if (!req.user?.businessId) {
      throw new ForbiddenError(
        "You need to be associated with a business to continue"
      );
    }


    const userId = await prisma.user.findFirst({
      where:{id: req.user.id}
    })

    const business = await prisma.business.findUnique({
      where: { id: req.user.businessId },
      include: {
        invites: {
          where: {
            email: req.user.email,
            status: "ACCEPTED",
            stillAMember: true
          }
        }
      }
    });

    if (!business) {
      throw new ForbiddenError(
        "You must be associated with a valid business to continue"
      );
    }

    // Check if user is the business owner
    if (userId?.businessId === business.id) {
      return next();
    }

    // Check if user is an accepted member via invite
    const isInvitedMember = business.invites.length > 0;

    if (isInvitedMember) {
      return next();
    }

    throw new ForbiddenError("You are not a member of this business");
  } catch (error) {
    next(error);
  }
};