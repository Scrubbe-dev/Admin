import { Business, Invites, User } from "@prisma/client";
import prisma from "../../prisma-clients/client";
import { ConflictError } from "../auth/error";
import { SignedPayload } from "../business-profile/business.types";
import jwt from "jsonwebtoken";

interface AcceptNewInvite {
  acceptedNewInvite: boolean;
  businessId?: string;
}

export class InviteUtil {
  constructor() {}
  
  static async acceptInvite(
    email: string,
    user: User
  ): Promise<AcceptNewInvite> {
    let acceptedNewInvite = false;
    let businessId: string | undefined;

    try {
      const invite = await prisma.invites.findFirst({
        where: {
          email,
          status: "PENDING"
        },
        include: {
          business: true,
        },
      });

      if (!invite) {
        throw new ConflictError("No pending invite found for this email");
      }

      if (invite.status === "ACCEPTED") {
        throw new ConflictError("Invite has already been accepted");
      }

      acceptedNewInvite = true;
      businessId = invite.business.id;

      // Update user's business relationship
      await prisma.user.update({
        where: { id: user.id },
        data: {
          businessId: invite.sentById,
          accountType: "BUSINESS"
        }
      });

      await prisma.invites.update({
        where: {
          id: invite.id,
        },
        data: {
          status: "ACCEPTED",
          stillAMember: true,
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          accepted: true,
          acceptedAt: new Date(),
        },
      });

      await this.addNewInviteAsParticipant(user, invite);

      return { acceptedNewInvite, businessId };
    } catch (error) {
      console.error(`Failed to accept invite: ${error}`);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }

  static async getInvitedBusinessId(email: string) {
    try {
      const invite = await prisma.invites.findFirst({
        where: {
          email,
          status: "ACCEPTED",
        },
        include: {
          business: true,
        },
      });

      if (invite?.status === "ACCEPTED") {
        return invite.business.id;
      }
    } catch (error) {
      console.error(
        "Error occurred while fetching user invite business id",
        error
      );
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }

  static async addNewInviteAsParticipant(existingUser: User, invite: Invites) {
    try {
      const openTickets = await prisma.incidentTicket.findMany({
        where: {
          businessId: invite.sentById,
          status: {
            not: "CLOSED",
          },
          conversation: {
            isNot: null,
          },
        },
        include: {
          conversation: true,
        },
      });

      for (const ticket of openTickets) {
        const conversationId = ticket.conversation?.id;
        if (!conversationId) continue;

        const alreadyParticipant =
          await prisma.conversationParticipant.findFirst({
            where: {
              conversationId,
              userId: existingUser.id,
            },
          });

        if (!alreadyParticipant) {
          await prisma.conversationParticipant.create({
            data: {
              conversation: { connect: { id: conversationId } },
              user: { connect: { id: existingUser.id } },
            },
          });
        }
      }
    } catch (error) {
      throw new Error(
        `${
          (error instanceof Error && error.message) ||
          "Error occurred while adding new member as conversation participant"
        }`
      );
    }
  }

  generateInviteToken(invite: any): string {
    const payload: SignedPayload = {
      inviteId: invite.id,
      email: invite.email,
      role: invite.role,
      accessPermissions: invite.accessPermissions,
      level: invite.level,
      workspaceName: invite.sentById,
      businessId: invite.sentById
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
  }

  async verifyInviteToken(token: string): Promise<SignedPayload> {
    return jwt.verify(token, process.env.JWT_SECRET!) as SignedPayload;
  }

  private async generateInviteLink(invite: any): Promise<string> {
    const baseUrl = "https://incidents.scrubbe.com/auth/invite";
    const token = this.generateInviteToken(invite);
    const inviteLink = `${baseUrl}?token=${encodeURIComponent(token)}`;
    return inviteLink;
  }
}