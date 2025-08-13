import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import slackConfig from "../../../config/slack.config";
import { DefaultChannelRequest } from "../types";
import { defaultChannelSchema } from "../integration.schema";
import { SlackSlashCommandRequest } from "./slack.type";
import { SlackService } from "./slack.service";
import { validateRequest } from "../../auth/utils/validators";

dotenv.config();

export class SlackController {
  constructor(private slackService: SlackService) {}

  async connectSlack(req: Request, res: Response, next: NextFunction) {
    try {
      const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI!);
      const userId = req.user?.sub!;
      // const { userId } = req.params; // replace with middleware userId after testing
      const clientId = slackConfig.clientId;

      const response = await this.slackService.connectSlack(
        redirectUri,
        clientId,
        userId
      );

      // res.redirect(response);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  
  async exchangeCodeForToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state: userId } = req.query;

      const response = await this.slackService.exchangeCodeForToken(
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
      const response = await this.slackService.getUserDefaultChannels(userId);
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

      const response = await this.slackService.submitDefaultChannels(
        userId,
        request
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async handleSlashCommand(req: Request, res: Response, next: NextFunction) {
    try {
      const request: SlackSlashCommandRequest = req.body;

      switch (request.command) {
        case "/incident-status": {
          const incidentId = request.text.trim();
          const statusResp = await this.slackService.getIncidentStatus(
            incidentId
          );
          res.json(statusResp);
          return;
        }

        case "/incident-close": {
          const incidentId = request.text.trim();
          const statusResp = await this.slackService.closeIncident(incidentId);
          res.json(statusResp);
          return;
        }

        default:
          res.json({ text: "Unknown command." });
      }
    } catch (error) {
      next(error);
    }
  }
}
