import prisma from "../../prisma-clients/client";
import { Invites, Prisma, PrismaClient, User } from "@prisma/client";
import {
  AcceptInviteTypes,
  BusinessSetUpRequest,
  DecodeInviteTokenResult,
  InviteMembers,
  IUserdata,
} from "./business.types";
import { Request } from "express";
import { BusinessUtil } from "./business.util";
import { ConflictError } from "../auth/error";
import { BusinessMapper } from "./business.mapper";
import { InviteUtil } from "../invite/invite.util";

export class BusinessService {
  private invitedata = null;
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
      // First verify the user has access to this business
      const userBusiness = await prisma.business.findFirst({
        where: {
          OR: [
            { userId: userId }, // User is the business owner
            { 
              invites: {
                some: {
                  email: { equals: String(prisma.user.fields.email) }, // User is invited member
                  status: "ACCEPTED",
                  stillAMember: true
                }
              }
            }
          ],
          id: businessId
        }
      });

      if (!userBusiness) {
        throw new ConflictError("You don't have access to this business");
      }

      const invites = await prisma.invites.findMany({
        where: {
          sentById: businessId,
          status: "ACCEPTED",
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

  async sendInvite(businessId: string, request: InviteMembers, userdata: IUserdata) {
    try {
      const invites = await prisma.invites.findFirst({
        where: {
          email: request.inviteEmail,
          sentById: businessId,
        },
      });

      if (invites) throw new ConflictError("User has already been invited");

      const invite = await prisma.invites.create({
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.inviteEmail,
          role: request.role,
          accessPermissions: request.accessPermissions,
          sentById: businessId,
        },
      });

      const businessData = await prisma.business.findFirst({
        where: { id: userdata.businessId }
      });

      if (!businessData) throw new ConflictError("Business does not exist");

      const newInvite = {
        firstName: request.firstName || userdata.firstName,
        lastName: request.lastName || userdata.lastName,
        inviteEmail: request.inviteEmail,
        role: request.role,
        businessId: userdata.businessId,
        workspaceName: businessData?.name,
        accessPermissions: request.accessPermissions
      };

      await this.businessUtil.sendInviteEmail(newInvite);

      return {
        message: `Invite sent to ${request.inviteEmail} successfully!`,
      };
    } catch (error) {
      console.error(`Error inviting member: ${error}`);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }

  async acceptInvite(request: AcceptInviteTypes) {
    try {
      // Find the invite with the correct business ID
      const invite = await this.prisma.invites.findFirst({
        where: { 
          email: request.email,
          sentById: request.businessId,
          status: "PENDING"
        }
      });

      if (!invite) {
        throw new ConflictError("Invalid invite or invite already accepted");
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: request.email }
      });

      let result;

      if (existingUser) {
        // Update existing user with business relationship
        result = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            businessId: request.businessId,
            accountType: "BUSINESS"
          }
        });

        // Update invite status
        await this.prisma.invites.update({
          where: { id: invite.id },
          data: {
            status: "ACCEPTED",
            stillAMember: true,
            userId: existingUser.id,
            accepted: true,
            acceptedAt: new Date(),
          }
        });

        // Add user as participant to existing conversations
        await InviteUtil.addNewInviteAsParticipant(existingUser, invite);

        return {
          message: "Existing user added to business successfully"
        };
      } else {
        // Create new user with business relationship
        result = await this.prisma.user.create({
          data: {
            email: request.email,
            firstName: request.firstName,
            lastName: request.lastName,
            passwordHash: await this.businessUtil.hashPassword(request.password),
            businessId: request.businessId,
            accountType: "BUSINESS"
          }
        });

        // Update invite status
        await this.prisma.invites.update({
          where: { id: invite.id },
          data: {
            status: "ACCEPTED",
            stillAMember: true,
            userId: result.id,
            accepted: true,
            acceptedAt: new Date(),
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
      const decodedToken = await this.businessUtil.decodeInviteToken(token);
      return decodedToken;
    } catch (error) {
      throw new ConflictError("Invalid or expired token");
    }
  }
}