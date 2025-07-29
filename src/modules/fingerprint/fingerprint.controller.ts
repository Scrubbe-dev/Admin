import { NextFunction, Request, Response } from "express";
import { FingerprintService } from "./fingerprint.service";
import {
  FingerprintConfigRequest,
  FingerprintConfigResponse,
} from "./fingerprint.types";
import { fingerprintConfigSchema } from "./fingerprint.schema";
import { validateRequest } from "../auth/utils/validators";

export class FingerprintController {
  constructor(private fingerprintService: FingerprintService) {}

  async fingerprintConfiguration(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const request = await validateRequest<FingerprintConfigRequest>(
        fingerprintConfigSchema,
        req.body
      );

      const result: FingerprintConfigResponse =
        await this.fingerprintService.fingerprintConfiguration(
          request,
          req.user?.sub!
        );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
