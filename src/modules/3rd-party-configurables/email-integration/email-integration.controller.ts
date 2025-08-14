import { Request, Response, NextFunction } from "express";
import { EmailIntegrationService } from "./email-integration.service";
import { validateRequest } from "../../auth/utils/validators";
import {
  ConnectEmailIntegrationRequest,
  emailIntegrationSchema,
} from "./email-integration.schema";

export class EmailIntegrationController {
  constructor(private service: EmailIntegrationService) {}

  async connectEmailIntegration(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.sub!;
      const request = await validateRequest<ConnectEmailIntegrationRequest>(
        emailIntegrationSchema,
        req.body
      );

      const result = await this.service.connectEmailIntegration(
        userId,
        request
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getEmailIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;

      const result = await this.service.getEmailIntegration(userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async handleInboundEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.handleInboundEmail(req.body);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
