"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessUtil = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_1 = require("../auth/error");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const resend_no_nodemailer_factory_1 = require("../auth/services/resend-no-nodemailer.factory");
dotenv_1.default.config();
class BusinessUtil {
    async updateBusinessAdmin(tx, input, id // or sub from req.user
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
            throw new error_1.ConflictError("Business account not found for this user");
        }
        return business;
    }
    async ensureBusinessDashboard(tx, businessId, dashboardPreference) {
        const existingDashboard = await tx.businessDashboard.findUnique({
            where: { businessId },
        });
        // If there's no existing dashboard, create one
        if (!existingDashboard) {
            const dashboard = await tx.businessDashboard.create({
                data: {
                    businessId,
                    colorAccent: dashboardPreference?.colorScheme,
                    defaultDashboard: dashboardPreference?.defaultDashboard,
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
    async hashPassword(password, saltRounds = 12) {
        return bcryptjs_1.default.hash(password, saltRounds);
    }
    async createTeamInvites(tx, businessId, inviteMembers) {
        const newInvites = [];
        const skippedInvites = [];
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
    sendInviteEmail = async (invite) => {
        try {
            console.log(`Sending invite email to: ${invite.inviteEmail}-------- ${invite}`);
            const inviteLink = await this.generateInviteLink(invite);
            // const emailService = new EmailService();
            // await emailService.sendInviteEmail(invite, inviteLink);
            await (0, resend_no_nodemailer_factory_1.createEmailServiceWithResend)().sendInviteEmail(invite, inviteLink);
        }
        catch (error) {
            throw new Error(`Error occured while sending email: ${error instanceof Error && error.message}`);
        }
    };
    // generateInviteLink = async (invite: InviteMembers) => {
    //   const baseUrl = "https://www.scrubbe.com/auth/invite";
    //   const payload = {
    //     email: invite.inviteEmail,
    //     firstName: invite.firstName,
    //     lastName: invite.lastName,
    //   };
    //   const token = this.generateInviteToken(payload);
    //   const inviteLink = `${baseUrl}?token=${token}`;
    //   return inviteLink;
    // };
    // generateInviteToken = (payload: SignedPayload): string => {
    //   return jwt.sign(payload, process.env.JWT_SECRET!, {
    //     expiresIn: "7d",
    //   });
    // };
    decodeInviteToken = async (token) => {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    };
    generateInviteToken(invite) {
        const payload = {
            email: invite.inviteEmail, // Use inviteEmail
            firstName: invite.firstName,
            lastName: invite.lastName,
            role: invite.role,
            accessPermissions: invite.accessPermissions,
            workspaceName: invite.workspaceName, // Business name
            businessId: invite.businessId
        };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
    }
    async verifyInviteToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    async generateInviteLink(invite) {
        const baseUrl = "https://www.scrubbe.com/auth/invite";
        const token = this.generateInviteToken(invite);
        const inviteLink = `${baseUrl}?token=${token}`;
        return inviteLink;
    }
}
exports.BusinessUtil = BusinessUtil;
