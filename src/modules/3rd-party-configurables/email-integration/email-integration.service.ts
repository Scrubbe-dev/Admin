import prisma from "../../../prisma-clients/client";
import {
  NotFoundError,
  ConflictError,
} from "../../auth/error";
import { ConnectEmailIntegrationRequest } from "./email-integration.schema";

export class EmailIntegrationService {
  async connectEmailIntegration(
    userId: string,
    input: ConnectEmailIntegrationRequest
  ) {
    const existing = await prisma.business.findFirst({
      where: { subdomain: input.subdomain },
    });

    if (existing) throw new ConflictError("Subdomain already in use");

    const incidentEmail = `${input.subdomain}@incidents.scrubbe.com`;

    const business = await prisma.business.update({
      where: { userId },
      data: {
        subdomain: input.subdomain,
        incidentEmail,
      },
    });

    return {
      incidentEmail: business.incidentEmail,
      subdomain: business.subdomain,
    };
  }

  async getEmailIntegration(userId: string) {
    // TODO - ADD INVITES AS PART OF SENDERS
    const business = await prisma.business.findFirst({
      where: { userId },
      select: {
        subdomain: true,
        incidentEmail: true,
      },
    });

    if (!business) throw new NotFoundError("Business not found");

    return business;
  }

  async handleInboundEmail(payload: any) {
    // const { to, from, subject, body } = payload;
    // // extract subdomain from recipient email
    // const match = to.match(/^([^@]+)@incidents\.scrubbe\.com$/);
    // if (!match) throw new UnauthorizedError("Invalid recipient address");
    // const subdomain = match[1];
    // const business = await prisma.business.findFirst({
    //   where: { subdomain },
    //   include: {
    //     user: {
    //       select: {
    //         email: true,
    //       },
    //     },
    //   },
    // });
    // if (!business) throw new NotFoundError("Tenant not found");
  }
}
