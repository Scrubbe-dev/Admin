import { NextFunction, Request, Response } from "express";
import { BusinessService } from "./business.service";
import { BusinessSetUpRequest } from "./business.types";
import { validateRequest } from "../auth/utils/validators";
import { businessSetUpSchema } from "./business.schema";

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

      const response = await this.businessService.fetchAllValidMembers(userId);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
