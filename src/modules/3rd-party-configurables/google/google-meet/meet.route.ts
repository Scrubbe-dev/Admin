import express from "express";
import { AuthMiddleware } from "../../../auth/middleware/auth.middleware";
import { TokenService } from "../../../auth/services/token.service";
import { MeetController } from "./meet.controller";
import { MeetService } from "./meet.service";

const meetRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const meetService = new MeetService();
const meetcontroller = new MeetController(meetService);
const authMiddleware = new AuthMiddleware(tokenService);

meetRouter.get(
  // "/connect/:userId",
  "/connect/",
  authMiddleware.authenticate,
  (req, res, next) => {
    meetcontroller.connectMeet(req, res, next);
  }
);

meetRouter.get("/oauth/callback", (req, res, next) => {
  meetcontroller.handleOAuthCallback(req, res, next);
});

export default meetRouter;
