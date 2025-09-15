import prisma from "../../prisma-clients/client";
import { Invites, Prisma, PrismaClient, User } from "@prisma/client";
import {
  BusinessSetUpRequest,
  DecodeInviteTokenResult,
  InviteMembers,
} from "./business.types";
import { Request } from "express";
import { BusinessUtil } from "./business.util";
import { ConflictError } from "../auth/error";
import { BusinessMapper } from "./business.mapper";
import { InviteUtil } from "../invite/invite.util";

export class BusinessService {
  constructor(
    private prisma: PrismaClient,
    private businessUtil: BusinessUtil = new BusinessUtil()
  ) {}

  async businessSetUp(
    input: BusinessSetUpRequest,
    req: Request
  ): Promise<{ message: string }> {
    const { newInvites, skippedInvites } = await prisma.$transaction(
      async (tx) => {
        const business = await this.businessUtil.updateBusinessAdmin(
          tx,
          input,
          req.user?.sub!
        );

        // Ensure dashboard exists
        await this.businessUtil.ensureBusinessDashboard(
          tx,
          business.id,
          input.dashboardPreference
        );

        const inviteMembers = await this.businessUtil.createTeamInvites(
          tx,
          business.id,
          input.inviteMembers
        );

        return inviteMembers;
      }
    );

    for (const invite of newInvites) {
      await this.businessUtil.sendInviteEmail(invite);
    }

    let message = `Setup successful. ${newInvites.length} ${
      newInvites.length == 1 ? "invite" : "invites"
    } sent.`;
    if (skippedInvites.length > 0) {
      message += ` Skipped: ${skippedInvites.join(", ")} (already invited).`;
    }

    return { message };
  }

  async validateInvite(token: string): Promise<DecodeInviteTokenResult> {
    try {
      const decoded = await this.businessUtil.decodeInviteToken(token);
      if (!decoded) {
        throw new ConflictError("Invalid or expired token");
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: decoded.email },
      });

      if (existingUser) {
        await InviteUtil.acceptInvite(decoded.email, existingUser);
      }

      return {
        existingUser: existingUser ? true : false,
        inviteData: decoded,
      };
    } catch (error) {
      throw new ConflictError(`${error instanceof Error && error.message}`);
    }
  }

  async fetchAllValidMembers(userId: string, businessId: string) {
    try {
      const invites = await prisma.invites.findMany({
        where: {
          sentById: businessId,
          accepted: true,
          stillAMember: true,
        },
      });

      const mappedInvites = invites.map((invite) =>
        BusinessMapper.toNameAndEmail(invite)
      );

      return mappedInvites;
    } catch (error) {
      console.error(`Error while fetching members: ${error}`);
      throw new Error(`Error while fetching members: ${error}`);
    }
  }



  async sendInvite(businessId: string, request: InviteMembers) {
    try {
      const invites = await prisma.invites.findUnique({
        where: {
          email: request.inviteEmail,
        },
      });

      if (invites) throw new ConflictError("User have already been invited");

      await prisma.invites.create({
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.inviteEmail,
          role: request.role,
          accessPermissions: request.accessPermissions,
          sentById: businessId,
        },
      });

      await this.businessUtil.sendInviteEmail(request);

      return {
        message: `Invite sent to ${request.inviteEmail} sucessfully!`,
      };
    } catch (error) {
      console.error(`Error inviting member: ${error}`);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }

  async acceptInvite(request: any) {
    try {
      // Find the invite
      const invite = await this.prisma.invites.findUnique({
        where: { email: request.email }
      });

      if (!invite) {
        throw new ConflictError("Invalid invite token");
      }

      // Verify the token
      const decodedToken = await this.businessUtil.verifyInviteToken(request.token);
      
      // Check if token matches the invite
      if (decodedToken.email !== invite.email) {
        throw new ConflictError("Token does not match invite");
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: request.email }
      });

      if (existingUser) {
        // Link existing user to business
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            business: request.businessId
          }
        });
        
        return {
          message: "Existing user added to business successfully"
        };
      } else {
        // Create new user
        const newUser = await this.prisma.user.create({
          data: {
            email: request.email,
            firstName: request.firstName,
            lastName: request.lastName,
            passwordHash: await this.businessUtil.hashPassword(request.password),
            business: request.businessId
          }
        });

        return {
          message: "New user created and added to business successfully"
        };
      }
    } catch (error) {
      console.error(`Error accepting invite: ${error}`);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }


   async decodeInvite(token: string): Promise<any> {
    try {
      const decodedToken = await this.businessUtil.verifyInviteToken(token);
      
      return {
        inviteEmail: decodedToken.email,
        role: decodedToken.role,
        accessPermissions: decodedToken.accessPermissions,
        level: decodedToken.level,
        workspaceName: decodedToken.workspaceName,
        businessId: decodedToken.businessId
      };
    } catch (error) {
      throw new ConflictError("Invalid or expired token");
    }
  }
}
