import { Prisma, PrismaClient } from "@prisma/client";
import {
  BusinessSetUpRequest,
  DashBoardPreference,
  DecodeInviteTokenResult,
  InviteMembers,
} from "./business.types";
import { Request } from "express";
import { BusinessUtil } from "./business.util";
import { ConflictError } from "../auth/error";

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
        const business = await this.businessUtil.updateBusinessAdmin(tx, input);

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

    // 2 because invite with 0 is invite not invites (I know english)
    let message = `Setup successful. ${newInvites.length} ${
      newInvites.length < 2 ? "invite" : "invites"
    } sent.`;
    if (skippedInvites.length > 0) {
      message += ` Skipped: ${skippedInvites.join(", ")} (already invited).`;
    }

    return { message };
  }

  async validateInvite(token: string): Promise<DecodeInviteTokenResult> {
    try {
      const decoded = await this.businessUtil.decodeToken(token);
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
}
