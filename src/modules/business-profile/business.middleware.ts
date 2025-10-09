import prisma from "../../prisma-clients/client";
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

export const mustBeAMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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