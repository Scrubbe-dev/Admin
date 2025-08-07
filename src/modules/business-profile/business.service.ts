import { Prisma, PrismaClient } from "@prisma/client";
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
    const { newInvites, skippedInvites } = await this.prisma.$transaction(
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

      const existingUser = await this.prisma.user.findUnique({
        where: { email: decoded.email },
      });

      return {
        existingUser: existingUser ? true : false,
        inviteData: decoded,
      };
    } catch (error) {
      throw new ConflictError(`Error occured during decoding: ${error}`);
    }
  }

  async fetchAllValidMembers(userId: string) {
    try {
      const invites = await this.prisma.invites.findMany({
        where: {
          accepted: true,
          stillAMember: true,
          business: {
            userId,
          },
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
      const invites = await this.prisma.invites.findUnique({
        where: {
          email: request.inviteEmail,
        },
      });

      if (invites) throw new ConflictError("User have already been invited");

      await this.prisma.invites.create({
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
}
