import { NextFunction, Request, Response } from "express";
import { IntegrationService } from "./integration.service";
import dotenv from "dotenv";
import slackConfig from "../../config/slack.config";
import { defaultChannelSchema } from "./integration.schema";
import { validateRequest } from "../auth/utils/validators";
import { DefaultChannelRequest } from "./types";
import { sendNotification } from "./notification-builder";
import { ConfigureSMSRequest } from "./sms/sms.type";
import { configureSMSschema } from "./sms/sms.schema";

dotenv.config();

export class IntegrationController {
  constructor(private integrationService: IntegrationService) {}

  async connectSlack(req: Request, res: Response, next: NextFunction) {
    try {
      const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI!);
      const userId = req.user?.sub!;
      // const { userId } = req.params; // replace with middleware userId after testing
      const clientId = slackConfig.slackClientId;

      const response = await this.integrationService.connectSlack(
        redirectUri,
        clientId,
        userId
      );

      res.redirect(response);
    } catch (error) {
      next(error);
    }
  }
  async connectSMS(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;

      const request = await validateRequest<ConfigureSMSRequest>(
        configureSMSschema,
        req.body
      );

      const response = await this.integrationService.connectSMS(
        request,
        userId
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async exchangeCodeForToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state: userId } = req.query;

      const response = await this.integrationService.exchangeCodeForToken(
        code as string,
        userId as string
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getUserDefaultChannels(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.sub!;
      const response = await this.integrationService.getUserDefaultChannels(
        userId
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitDefaultChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const request = await validateRequest<DefaultChannelRequest>(
        defaultChannelSchema,
        req.body
      );

      const response = await this.integrationService.submitDefaultChannels(
        userId,
        request
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async sendNoti(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const response = await sendNotification(
        "SLACK",
        userId,
        "HELLOOOOO AND WELCOME (TEST)"
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
