"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailIntegrationService = void 0;
const client_1 = __importDefault(require("../../../prisma-clients/client"));
const error_1 = require("../../auth/error");
const incident_service_1 = require("../../incident-ticket/incident.service");
const email_integration_util_1 = require("./email-integration.util");
class EmailIntegrationService {
    incidentservice;
    constructor(incidentservice = new incident_service_1.IncidentService()) {
        this.incidentservice = incidentservice;
    }
    async connectEmailIntegration(userId, input) {
        const existing = await client_1.default.business.findFirst({
            where: { subdomain: input.subdomain },
        });
        if (existing)
            throw new error_1.ConflictError("Subdomain already in use");
        const incidentEmail = `${input.subdomain}@incidents.scrubbe.com`;
        const userBusinessId = await client_1.default.user.findFirst({
            where: { id: userId },
        });
        const business = await client_1.default.business.update({
            where: { id: userBusinessId?.businessId },
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
    async getEmailIntegration(userId) {
        const userBusinessId = await client_1.default.user.findFirst({
            where: { id: userId },
        });
        const business = await client_1.default.business.findFirst({
            where: { id: userBusinessId?.businessId },
            select: {
                subdomain: true,
                incidentEmail: true,
            },
        });
        if (!business)
            throw new error_1.NotFoundError("Business not found");
        return business;
    }
    async handleInboundEmail(payload) {
        console.log("PAYLOAD FROM EMAIL INTEGRATION SERVICE", payload);
        const parsedCommand = email_integration_util_1.EmailIntegrationUtil.parseIncidentEmail(payload);
        console.log("=============== PARSED COMMAND ===============", parsedCommand);
        const senderEmail = parsedCommand.incident?.fromEmail?.toLowerCase();
        if (!senderEmail)
            throw new error_1.UnauthorizedError("Sender email is missing");
        // Find user with their business relation
        const user = await client_1.default.user.findFirst({
            where: { email: senderEmail },
            include: {
                business: {
                    select: {
                        id: true,
                        subdomain: true
                    }
                }
            },
        });
        if (!user)
            throw new error_1.UnauthorizedError("You are not allowed to perform this action");
        const match = payload.to.match(/^([^@]+)@incidents\.scrubbe\.com$/);
        if (!match)
            throw new error_1.UnauthorizedError("Invalid recipient address");
        const subdomain = match[1];
        if (user.business?.subdomain !== subdomain) {
            throw new error_1.UnauthorizedError("Email recipient does not match your business, configure your subdomain if you haven't");
        }
        const business = await client_1.default.business.findFirst({
            where: { subdomain },
            include: {
                users: {
                    select: {
                        id: true, // Add id to select
                        email: true
                    }
                }
            },
        });
        if (!business)
            throw new error_1.NotFoundError("Tenant not found");
        // Get business owner email from the User array
        const businessOwner = business.users.filter(u => u.id === user.id)[0];
        if (!businessOwner)
            throw new error_1.NotFoundError("Business owner not found");
        const invites = await client_1.default.invites.findMany({
            where: {
                accepted: true,
                stillAMember: true,
                sentById: business.id,
            },
        });
        const memberEmails = [
            businessOwner.email.toLowerCase(),
            ...invites.map((inv) => inv.email.toLowerCase()),
        ];
        if (!memberEmails.includes(senderEmail)) {
            throw new error_1.UnauthorizedError("Sender not authorized for this business");
        }
        const request = {
            assignedTo: parsedCommand.incident?.assignedTo || memberEmails[1], // fallback to first invite
            priority: parsedCommand.incident?.priority || "MEDIUM",
            reason: parsedCommand.incident?.reason ??
                `Reason not specified, incident was raised through email by: ${parsedCommand.incident?.fromEmail}`,
            template: parsedCommand.incident?.template,
            userName: parsedCommand.incident?.username || "N/A",
            createdFrom: "EMAIL",
        };
        await this.incidentservice.submitIncident(request, user.id, business.id);
        console.log("========= INCIDENT CREATED SUCCESSFULLY FROM EMAIL =========");
    }
}
exports.EmailIntegrationService = EmailIntegrationService;
