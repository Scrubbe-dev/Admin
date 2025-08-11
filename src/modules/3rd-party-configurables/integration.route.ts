import express from "express";
import { TokenService } from "../auth/services/token.service";
import { IntegrationService } from "./integration.service";
import { IntegrationController } from "./Integration.controller";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";

const integrationRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const integrationService = new IntegrationService();
const integrationController = new IntegrationController(integrationService);
const authMiddleware = new AuthMiddleware(tokenService);

integrationRouter.use(authMiddleware.authenticate);

integrationRouter.get("/slack/connect", (req, res, next) => {
  integrationController.connectSlack(req, res, next);
});

integrationRouter.get("/slack/oauth/callback", (req, res, next) => {
  integrationController.exchangeCodeForToken(req, res, next);
});

integrationRouter.get("/slack/channels", (req, res, next) => {
  integrationController.getUserDefaultChannels(req, res, next);
});

integrationRouter.post("/slack/default-channel", (req, res, next) => {
  integrationController.submitDefaultChannel(req, res, next);
});

integrationRouter.post("/sms/connect", (req, res, next) => {
  integrationController.connectSMS(req, res, next);
});

// TODO - REMOVE AFTER TESTING
integrationRouter.get("/send-noti", (req, res, next) => {
  integrationController.sendNoti(req, res, next);
});

export default integrationRouter;
