"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteUtil = void 0;
const client_1 = __importDefault(require("../../prisma-clients/client"));
const error_1 = require("../auth/error");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class InviteUtil {
    constructor() { }
    static async acceptInvite(email, user) {
        let acceptedNewInvite = false;
        try {
            const invite = await client_1.default.invites.findFirst({
                where: {
                    email,
                },
                include: {
                    business: true,
                },
            });
            if (invite && invite.status === "ACCEPTED")
                throw new error_1.ConflictError("Invite have already been accepted");
            if (invite && invite.status === "PENDING") {
                acceptedNewInvite = true;
                await client_1.default.invites.update({
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
                await this.addNewInviteAsParticipant(user, invite);
            }
            return { acceptedNewInvite, businessId: invite?.business.id };
        }
        catch (error) {
            console.error(`Failed to accept invite: ${error}`);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    static async getInvitedBusinessId(email) {
        try {
            const invite = await client_1.default.invites.findFirst({
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
        }
        catch (error) {
            console.error("Error occured while fetching user invite business id", error);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    static async addNewInviteAsParticipant(existingUser, invite) {
        try {
            const openTickets = await client_1.default.incidentTicket.findMany({
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
                if (!conversationId)
                    continue;
                const alreadyParticipant = await client_1.default.conversationParticipant.findFirst({
                    where: {
                        conversationId,
                        userId: existingUser.id,
                    },
                });
                if (!alreadyParticipant) {
                    await client_1.default.conversationParticipant.create({
                        data: {
                            conversation: { connect: { id: conversationId } },
                            user: { connect: { id: existingUser.id } },
                        },
                    });
                }
            }
        }
        catch (error) {
            throw new Error(`${(error instanceof Error && error.message) ||
                "Error occured while adding new member as conversation participant"}`);
        }
    }
    generateInviteToken(invite) {
        const payload = {
            inviteId: invite.id,
            email: invite.email,
            role: invite.role,
            accessPermissions: invite.accessPermissions,
            level: invite.level,
            workspaceName: invite.sentById, // Business name from sentById
            businessId: invite.sentById
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
        const inviteLink = `${baseUrl}?token=${encodeURIComponent(token)}`;
        return inviteLink;
    }
}
exports.InviteUtil = InviteUtil;
