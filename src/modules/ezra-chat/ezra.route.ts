import express from "express";
import { EzraController } from "./ezra.controller";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { TokenService } from "../auth/services/token.service";
import { EzraService } from "./ezra.service";

const ezraRouter = express.Router();

const prismaClient = new PrismaClient();
const tokenService = new TokenService(
  prismaClient,
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const ezraService = new EzraService(prismaClient);
const ezraController = new EzraController(ezraService);
const authMiddleware = new AuthMiddleware(tokenService);

ezraRouter.post(
  "/incidents/summary",
  authMiddleware.authenticate,
  (req, res, next) => ezraController.summarizeIncidents(req, res, next)
);

ezraRouter.post("/rule", authMiddleware.authenticate, (req, res, next) =>
  ezraController.createRuleFromPrompt(req, res, next)
);

export default ezraRouter;
