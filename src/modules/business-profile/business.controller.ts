import { NextFunction, Request, Response } from "express";
import { BusinessService } from "./business.service";
import { BusinessSetUpRequest, InviteMembers } from "./business.types";
import { validateRequest } from "../auth/utils/validators";
import { businessSetUpSchema, inviteMembersSchema } from "./business.schema";

export class BusinessController {
  private businessService: BusinessService;

  constructor(businessService: BusinessService) {
    this.businessService = businessService;
  }

  async businessSetUp(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await validateRequest<BusinessSetUpRequest>(
        businessSetUpSchema,
        req.body
      );

      const result = await this.businessService.businessSetUp(request, req);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async validateInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.token;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      const decoded = await this.businessService.validateInvite(token);
      res.json(decoded);
    } catch (error) {
      next(error);
    }
  }

  async fetchAllValidMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const businessId = req.user?.businessId!;

      const response = await this.businessService.fetchAllValidMembers(userId, businessId);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async sendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId!;
      const request = await validateRequest<InviteMembers>(
        inviteMembersSchema,
        req.body
      );

      const response = await this.businessService.sendInvite(
        businessId,
        request
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
