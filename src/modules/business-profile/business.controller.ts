import { NextFunction, Request, Response } from "express";
import { BusinessService } from "./business.service";
import { AcceptInviteTypes, BusinessSetUpRequest, DecodeInvite, InviteMembers, SignedPayload } from "./business.types";
import { validateRequest } from "../auth/utils/validators";
import { acceptInviteSchema, businessSetUpSchema, decodeInviteSchema, inviteMembersSchema } from "./business.schema";
import { AccountType } from "@prisma/client";
import jwt from "jsonwebtoken";
import { ConflictError, UnauthorizedError } from "../auth/error";
import prisma from "../../lib/prisma";


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
      const dataBusinessId = await prisma?.user.findUnique({
        where: { id: userId },
        select:{
          businessId:true
        }
      });
      const businessIdFromDB = dataBusinessId?.businessId;
      const businessId = req.user?.businessId!;

      console.log(userId , businessId ,businessIdFromDB ," ============USERID & BUSINESSID======================" )

      const response = await this.businessService.fetchAllValidMembers(userId, businessId);
      console.log(response , "===================FROM GET MEMBERS===========")
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async sendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const userdata = await this.getAuthTokenData(req,res)
      console.log(userdata,"===============USERDATA======================")
      const request = await validateRequest<InviteMembers>(
        inviteMembersSchema,
        req.body
      );
    console.log(request,"=========================REQUEST==============")
      const response = await this.businessService.sendInvite(
        userdata?.businessId as string,
        request,
        userdata as any
      );
     console.log(response,"=========================RESPONSE==============")

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

// controller.ts
async decodeInvite(req: Request, res: Response, next: NextFunction) {
    try {
        const request = await validateRequest<DecodeInvite>(decodeInviteSchema, req.body);
        const response: SignedPayload = await this.businessService.decodeInvite(request.token);
        res.json({ ...response, message: "======SENT DATA FROM API========" });
    } catch (error) {
        next(error);
    }
}



// FIX: Add proper error handling
// In your controller
async acceptInvite(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('Raw request body:', req.body);
    const request = await validateRequest<AcceptInviteTypes>(acceptInviteSchema, req.body);
    console.log('Validated request:', request);
    
    const response = await this.businessService.acceptInvite(request);
    res.json(response);
  } catch (error) {
    console.error('Controller error:', error);
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






  