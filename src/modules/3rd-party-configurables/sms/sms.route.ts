import express from "express";
import { TokenService } from "../../auth/services/token.service";
import { SMSController } from "./sms.controller";
import { AuthMiddleware } from "../../auth/middleware/auth.middleware";
import { SMSService } from "./sms.service";

const smsRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const smsService = new SMSService();
const smsController = new SMSController(smsService);
const authMiddleware = new AuthMiddleware(tokenService);

smsRouter.use(authMiddleware.authenticate);

smsRouter.post("/connect", (req, res, next) => {
  smsController.connectSMS(req, res, next);
});

export default smsRouter;
