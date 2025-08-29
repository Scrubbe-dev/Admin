import { Priority } from "@prisma/client";
import prisma from "../../../prisma-clients/client";
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from "../../auth/error";
import { IncidentService } from "../../incident-ticket/incident.service";
import { IncidentRequest } from "../../incident-ticket/incident.types";
import { ConnectEmailIntegrationRequest } from "./email-integration.schema";
import { EmailPayload } from "./email-integration.types";
import { EmailIntegrationUtil } from "./email-integration.util";

export class EmailIntegrationService {
  constructor(private incidentservice = new IncidentService()) {}

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

  async handleInboundEmail(payload: EmailPayload) {
    console.log("PAYLOAD FROM EMAIL INTEGRATION SERVICE", payload);

    const parsedCommand = EmailIntegrationUtil.parseIncidentEmail(payload);
    console.log(
      "=============== PARSED COMMAND ===============",
      parsedCommand
    );

    const senderEmail = parsedCommand.incident?.fromEmail?.toLowerCase();
    if (!senderEmail) throw new UnauthorizedError("Sender email is missing");

    const user = await prisma.user.findFirst({
      where: { email: senderEmail },
      include: { business: { select: { id: true, subdomain: true } } },
    });

    if (!user)
      throw new UnauthorizedError("You are not allowed to perform this action");

    const match = payload.to.match(/^([^@]+)@incidents\.scrubbe\.com$/);
    if (!match) throw new UnauthorizedError("Invalid recipient address");

    const subdomain = match[1];

    if (user.business?.subdomain !== subdomain) {
      throw new UnauthorizedError(
        "Email recipient does not match your business, configure your subdomain if you haven't"
      );
    }

    const business = await prisma.business.findFirst({
      where: { subdomain },
      include: { user: { select: { email: true } } },
    });

    if (!business) throw new NotFoundError("Tenant not found");

    const invites = await prisma.invites.findMany({
      where: {
        accepted: true,
        stillAMember: true,
        sentById: business.id,
      },
    });

    const memberEmails = [
      business.user.email.toLowerCase(),
      ...invites.map((inv) => inv.email.toLowerCase()),
    ];

    if (!memberEmails.includes(senderEmail)) {
      throw new UnauthorizedError("Sender not authorized for this business");
    }

    const request: IncidentRequest = {
      assignedTo: parsedCommand.incident?.assignedTo || memberEmails[1], // fallback to first invite
      priority: (parsedCommand.incident?.priority as Priority) || "MEDIUM",
      reason:
        parsedCommand.incident?.reason ??
        `Reason not specified, incident was raised through email by: ${parsedCommand.incident?.fromEmail}`,
      template: parsedCommand.incident?.template as any,
      userName: parsedCommand.incident?.username || "N/A",
      createdFrom: "EMAIL",
    };

    await this.incidentservice.submitIncident(request, user.id, business.id);
    console.log("========= INCIDENT CREATED SUCCESSFULLY FROM EMAIL =========");
  }
}
