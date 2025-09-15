import { NextFunction, Request, Response } from "express";
import { BusinessService } from "./business.service";
import { BusinessSetUpRequest, DecodeInvite, InviteMembers, SignedPayload } from "./business.types";
import { validateRequest } from "../auth/utils/validators";
import { acceptInviteSchema, businessSetUpSchema, decodeInviteSchema, inviteMembersSchema } from "./business.schema";
import { AccountType } from "@prisma/client";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../auth/error";

export class BusinessController {
  private businessService: BusinessService;

  constructor(businessService: BusinessService) {
    this.businessService = businessService;
  }

  async businessSetUp(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await validateRequest<BusinessSetUpRequest>(
        businessSetUpSchema,
        req.body
      );

      const result = await this.businessService.businessSetUp(request, req);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async validateInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.token;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      const decoded = await this.businessService.validateInvite(token);
      res.json(decoded);
    } catch (error) {
      next(error);
    }
  }

  async fetchAllValidMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const businessId = req.user?.businessId!;

      const response = await this.businessService.fetchAllValidMembers(userId, businessId);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async sendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const userdata = await this.getAuthTokenData(req,res)
      const request = await validateRequest<InviteMembers>(
        inviteMembersSchema,
        req.body
      );

      const response = await this.businessService.sendInvite(
        userdata?.businessId as string,
        request
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async decodeInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await validateRequest<DecodeInvite>(decodeInviteSchema, req.body);
      const response:SignedPayload = await this.businessService.decodeInvite(request.token) as SignedPayload;
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  async acceptInvite(req: Request, res: Response, next: NextFunction) {
      try {
        const request = await validateRequest(acceptInviteSchema, req.body);
        
        const response = await this.businessService.acceptInvite(request);
        res.json(response);
      } catch (error) {
        next(error);
      }
    }


    async getAuthTokenData(req:Request , res:Response){
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Authentication required");
      }

      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {id: string;
            sub: string;
            firstName: string;
            lastName: string;
            email: string;
            accountType?: AccountType;
            businessId?: string;
            scopes?: string[] };
      return decoded;
  }catch(err){
    console.log(err, "================  Error during authentication ======================")
  }
}

};






  