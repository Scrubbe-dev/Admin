import {
  BusinessSetUpRequest,
  DashBoardPreference,
  InviteMembers,
  SignedPayload,
} from "./business.types";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { EmailService } from "../auth/services/email.service";
import { Prisma } from "@prisma/client";
import { ConflictError, ForbiddenError } from "../auth/error";

dotenv.config();

export class BusinessUtil {
  async updateBusinessAdmin(
    tx: Prisma.TransactionClient,
    input: BusinessSetUpRequest,
    id: string // or sub from req.user
  ) {
    const updatedBusinessAdmin = await tx.user.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.adminEmail,
        business: {
          update: {
            name: input.companyName,
            industry: input.industry,
            companySize: input.companySize,
            primaryRegion: input.primaryRegion,
            logo: input.companyLogo,
          },
        },
        developer: {
          upsert: {
            create: { jobTitle: input.adminJobTitle },
            update: { jobTitle: input.adminJobTitle },
          },
        },
      },
      include: { business: true },
    });

    const business = await tx.business.findUnique({
      where: { userId: updatedBusinessAdmin.id },
      select: { id: true, dashboard: true },
    });

    if (!business) {
      throw new ConflictError("Business account not found for this user");
    }

    return business;
  }

  async ensureBusinessDashboard(
    tx: Prisma.TransactionClient,
    businessId: string,
    dashboardPreference: DashBoardPreference | undefined
  ): Promise<void> {
    const existingDashboard = await tx.businessDashboard.findUnique({
      where: { businessId },
    });

    // If there's no existing dashboard, create one
    if (!existingDashboard) {
      const dashboard = await tx.businessDashboard.create({
        data: {
          businessId,
          colorAccent: dashboardPreference?.colorScheme as string,
          defaultDashboard: dashboardPreference?.defaultDashboard as any,
          prefferedIntegration: dashboardPreference?.prefferedIntegration,
          notificationChannels: dashboardPreference?.notificationChannels,
        },
      });

      await tx.business.update({
        where: { id: businessId },
        data: { dashBoardId: dashboard.id },
      });
    }
  }

  async createTeamInvites(
    tx: Prisma.TransactionClient,
    businessId: string,
    inviteMembers: InviteMembers[] | undefined
  ) {
    const newInvites: InviteMembers[] = [];
    const skippedInvites: string[] = [];

    if (!inviteMembers || inviteMembers.length === 0) {
      return { newInvites, skippedInvites };
    }

    if (inviteMembers && inviteMembers.length > 0) {
      for (const invite of inviteMembers) {
        const existingInvite = await tx.invites.findUnique({
          where: { email: invite.inviteEmail },
        });

        if (existingInvite) {
          console.log(`Invite already exists for ${invite.inviteEmail}`);
          skippedInvites.push(invite.inviteEmail);
          continue;
        }

        await tx.invites.create({
          data: {
            firstName: invite.firstName,
            lastName: invite.lastName,
            email: invite.inviteEmail,
            role: invite.role,
            accessPermissions: invite.accessPermissions,
            sentById: businessId,
          },
        });

        newInvites.push(invite);
      }
    }

    return { newInvites, skippedInvites };
  }

  sendInviteEmail = async (invite: InviteMembers) => {
    console.log(`Sending invite email to: ${invite.inviteEmail}`);

    const inviteLink = await this.generateInviteLink(invite);

    const emailService = new EmailService();

    await emailService.sendInviteEmail(invite, inviteLink);
  };

  generateInviteLink = async (invite: InviteMembers) => {
    const baseUrl = "https://www.scrubbe.com/invite";

    const payload = {
      email: invite.inviteEmail,
      firstName: invite.firstName,
      lastName: invite.lastName,
    };

    const token = this.generateInviteToken(payload);
    const inviteLink = `${baseUrl}?token=${token}`;

    return inviteLink;
  };

  generateInviteToken = (payload: SignedPayload): string => {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
  };

  decodeInviteToken = async (token: string): Promise<SignedPayload> => {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}
