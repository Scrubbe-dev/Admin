"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessService = void 0;
const client_1 = __importDefault(require("../../prisma-clients/client"));
const business_util_1 = require("./business.util");
const error_1 = require("../auth/error");
const business_mapper_1 = require("./business.mapper");
const invite_util_1 = require("../invite/invite.util");
class BusinessService {
    prisma;
    businessUtil;
    invitedata = null;
    constructor(prisma, businessUtil = new business_util_1.BusinessUtil()) {
        this.prisma = prisma;
        this.businessUtil = businessUtil;
    }
    async businessSetUp(input, req) {
        const { newInvites, skippedInvites } = await client_1.default.$transaction(async (tx) => {
            const business = await this.businessUtil.updateBusinessAdmin(tx, input, req.user?.sub);
            // Ensure dashboard exists
            await this.businessUtil.ensureBusinessDashboard(tx, business.id, input.dashboardPreference);
            const inviteMembers = await this.businessUtil.createTeamInvites(tx, business.id, input.inviteMembers);
            return inviteMembers;
        });
        for (const invite of newInvites) {
            await this.businessUtil.sendInviteEmail(invite);
        }
        let message = `Setup successful. ${newInvites.length} ${newInvites.length == 1 ? "invite" : "invites"} sent.`;
        if (skippedInvites.length > 0) {
            message += ` Skipped: ${skippedInvites.join(", ")} (already invited).`;
        }
        return { message };
    }
    async validateInvite(token) {
        try {
            const decoded = await this.businessUtil.decodeInviteToken(token);
            if (!decoded) {
                throw new error_1.ConflictError("Invalid or expired token");
            }
            const existingUser = await client_1.default.user.findUnique({
                where: { email: decoded.email },
            });
            if (existingUser) {
                await invite_util_1.InviteUtil.acceptInvite(decoded.email, existingUser);
            }
            return {
                existingUser: existingUser ? true : false,
                inviteData: decoded,
            };
        }
        catch (error) {
            throw new error_1.ConflictError(`${error instanceof Error && error.message}`);
        }
    }
    async fetchAllValidMembers(userId, businessId) {
        try {
            const invites = await client_1.default.invites.findMany({
                where: {
                    sentById: businessId,
                    accepted: true,
                    stillAMember: true,
                },
            });
            const mappedInvites = invites.map((invite) => business_mapper_1.BusinessMapper.toNameAndEmail(invite));
            return mappedInvites;
        }
        catch (error) {
            console.error(`Error while fetching members: ${error}`);
            throw new Error(`Error while fetching members: ${error}`);
        }
    }
    async sendInvite(businessId, request, userdata) {
        try {
            const invites = await client_1.default.invites.findUnique({
                where: {
                    email: request.inviteEmail,
                },
            });
            if (invites)
                throw new error_1.ConflictError("User have already been invited");
            await client_1.default.invites.create({
                data: {
                    firstName: request.firstName,
                    lastName: request.lastName,
                    email: request.inviteEmail,
                    role: request.role,
                    accessPermissions: request.accessPermissions,
                    sentById: businessId,
                },
            });
            // inviteId?: string;
            // email: string;
            // firstName?: string;
            // lastName?: string;
            // role?: Role;
            // accessPermissions?: AccessPermissions[];
            // level?: string;
            // workspaceName?: string;
            // businessId?: string;
            const businessData = await client_1.default.business.findFirst({
                where: { id: userdata.businessId }
            });
            if (!businessData)
                throw new error_1.ConflictError("Business does not exist");
            const newInvite = {
                firstName: userdata.firstName,
                lastName: userdata.lastName,
                inviteEmail: request.inviteEmail,
                role: request.role,
                businessId: userdata.businessId,
                workspaceName: businessData?.name,
                accessPermissions: request.accessPermissions
            };
            await this.businessUtil.sendInviteEmail(newInvite);
            return {
                message: `Invite sent to ${request.inviteEmail} sucessfully!`,
            };
        }
        catch (error) {
            console.error(`Error inviting member: ${error}`);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    async acceptInvite(request) {
        try {
            // Find the invite
            const invite = await this.prisma.invites.findUnique({
                where: { email: request.email }
            });
            if (!invite) {
                throw new error_1.ConflictError("Invalid invite token");
            }
            // Verify the token
            // const decodedToken = await this.businessUtil.verifyInviteToken(request.token);
            // Check if token matches the invite
            // if (decodedToken.email !== invite.email) {
            //   throw new ConflictError("Token does not match invite");
            // }
            // Check if user already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: request.email }
            });
            if (existingUser) {
                // Link existing user to business
                await this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        business: {
                            connect: { id: request.businessId }
                        }
                    }
                });
                return {
                    message: "Existing user added to business successfully"
                };
            }
            else {
                // Create new user
                await this.prisma.user.create({
                    data: {
                        email: request.email,
                        firstName: request.firstName,
                        lastName: request.lastName,
                        passwordHash: await this.businessUtil.hashPassword(request.password),
                        business: {
                            connect: { id: request.businessId }
                        }
                    }
                });
                return {
                    message: "New user created and added to business successfully"
                };
            }
        }
        catch (error) {
            console.error(`Error accepting invite: ${error}`);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    async decodeInvite(token) {
        try {
            const decodedToken = await this.businessUtil.decodeInviteToken(token);
            return decodedToken;
        }
        catch (error) {
            throw new error_1.ConflictError("Invalid or expired token");
        }
    }
}
exports.BusinessService = BusinessService;
