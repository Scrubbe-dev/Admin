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

      const result = await this.businessService.businessSetUp(request);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
