import express from "express";
import { BusinessController } from "./business.controller";
import { BusinessService } from "./business.service";
import { PrismaClient } from "@prisma/client";
import { EmailServices } from "../password-reset/email.services";

const businessRouter = express.Router();

const prismaClient = new PrismaClient();
const emailService = new EmailServices();
const businessService = new BusinessService(prismaClient, emailService);
const businessController = new BusinessController(businessService);

businessRouter.put("/welcome", (req, res, next) => {
  businessController.businessSetUp(req, res, next);
});

export default businessRouter;
