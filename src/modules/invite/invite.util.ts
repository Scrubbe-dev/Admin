import { User } from "@prisma/client";
import prisma from "../../prisma-clients/client";

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

    try {
      const invites = await prisma.invites.findFirst({
        where: {
          email,
        },
        include: {
          business: true,
        },
      });

      if (invites && invites.status === "PENDING") {
        acceptedNewInvite = true;

        await prisma.invites.update({
          where: {
            email: email,
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
      }

      return { acceptedNewInvite, businessId: invites?.business.id };
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
        "Error occured while fetching user invite business id",
        error
      );
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }
}
