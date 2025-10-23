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

export const mustBeAMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

      const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Authentication required");
          }
    
          const token = authHeader.split(" ")[1];
          const payload = await tokenService.verifyAccessToken(token);
    
          // Ensure we have the user ID in the payload
          if (!payload.sub) {
            throw new UnauthorizedError("Invalid token: missing user ID");
          }
       req.user = payload as any;

    if (!req.user?.businessId) {
      throw new ForbiddenError(
        "You need to be associated with a business to continue"
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: req.user.businessId },
    });

    if (!business) {
      throw new ForbiddenError(
        "You must be associated with a valid business to continue"
      );
    }

    // Check if user is the business owner
    if (business.userId === req.user.id) {
      return next();
    }

    // Check if user is an accepted member via invite
    const invite = await prisma.invites.findFirst({
      where: {
        email: req.user.email,
        sentById: req.user.businessId,
        status: "ACCEPTED",
        stillAMember: true,
      },
    });

    if (invite) {
      return next();
    }

    throw new ForbiddenError("You are not a member of this business");
  } catch (error) {
    next(error);
  }
};