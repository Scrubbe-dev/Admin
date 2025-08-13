import { NextFunction, Request, Response } from "express";
import { WhatsappService } from "./whatsapp.service";
import { validateRequest } from "../../auth/utils/validators";
import { whatsappSchema } from "./whatsapp.schema";
import { WhatsappRequest } from "./whatsapp.types";

export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  async connectWhatsapp(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const businessId = req.user?.businessId;

      const request = await validateRequest<WhatsappRequest>(
        whatsappSchema,
        req.body
      );

      const response = await this.whatsappService.connectWhatsapp(
        businessId,
        userId,
        request
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
