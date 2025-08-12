import express from "express";
import { TokenService } from "../../auth/services/token.service";
import { AuthMiddleware } from "../../auth/middleware/auth.middleware";
import { verifySlackSignature } from "./slack.middleware";
import { SlackService } from "./slack.service";
import { SlackController } from "./slack.controller";

const slackRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const slackService = new SlackService();
const slackController = new SlackController(slackService);
const authMiddleware = new AuthMiddleware(tokenService);

slackRouter.get(
  "/connect",
  authMiddleware.authenticate,
  (req, res, next) => {
    slackController.connectSlack(req, res, next);
  }
);

slackRouter.get(
  "/oauth/callback",
  authMiddleware.authenticate,
  (req, res, next) => {
    slackController.exchangeCodeForToken(req, res, next);
  }
);

slackRouter.get(
  "/channels",
  authMiddleware.authenticate,
  (req, res, next) => {
    slackController.getUserDefaultChannels(req, res, next);
  }
);

slackRouter.post(
  "/default-channel",
  authMiddleware.authenticate,
  (req, res, next) => {
    slackController.submitDefaultChannel(req, res, next);
  }
);

slackRouter.post(
  "/commands",
  express.urlencoded({ extended: true }),
  // verifySlackSignature,
  (req, res, next) => slackController.handleSlashCommand(req, res, next)
);

export default slackRouter;
