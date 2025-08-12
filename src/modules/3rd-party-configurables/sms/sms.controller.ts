import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { validateRequest } from "../../auth/utils/validators";
import { ConfigureSMSRequest } from "./sms.type";
import { configureSMSschema } from "./sms.schema";
import { SMSService } from "./sms.service";

dotenv.config();

export class SMSController {
  constructor(private smsService: SMSService) {}

  async connectSMS(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;

      const request = await validateRequest<ConfigureSMSRequest>(
        configureSMSschema,
        req.body
      );

      const response = await this.smsService.connectSMS(
        request,
        userId
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
