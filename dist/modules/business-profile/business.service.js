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
            // First verify the user has access to this business
            const user = await client_1.default.user.findUnique({
                where: { id: userId },
                select: { email: true, businessId: true }
            });
            if (!user) {
                throw new error_1.ConflictError("User not found");
            }
            const userBusiness = await client_1.default.business.findFirst({
                where: {
                    OR: [
                        { userId: userId }, // User is the business owner
                        {
                            invites: {
                                some: {
                                    email: user.email, // User is invited member
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
                throw new error_1.ConflictError("You don't have access to this business");
            }
            // Get all valid members: business owner + accepted invites
            const [businessOwner, acceptedInvites] = await Promise.all([
                // Get business owner
                client_1.default.user.findUnique({
                    where: { id: userBusiness.userId },
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }),
                // Get accepted invites
                client_1.default.invites.findMany({
                    where: {
                        sentById: businessId,
                        status: "ACCEPTED",
                        stillAMember: true,
                    },
                })
            ]);
            // Map business owner to member format
            const ownerMember = businessOwner ? {
                firstname: businessOwner.firstName,
                lastname: businessOwner.lastName,
                email: businessOwner.email,
                isOwner: true
            } : null;
            // Map invites to member format
            const invitedMembers = acceptedInvites.map((invite) => ({
                ...business_mapper_1.BusinessMapper.toNameAndEmail(invite),
                isOwner: false
            }));
            // Combine owner and invited members, filter out null owner if needed
            const allMembers = ownerMember ? [ownerMember, ...invitedMembers] : invitedMembers;
            return allMembers;
        }
        catch (error) {
            console.error(`Error while fetching members: ${error}`);
            throw new Error(`Error while fetching members: ${error}`);
        }
    }
    async sendInvite(businessId, request, userdata) {
        try {
            // Check if user already has a pending or accepted invite
            const existingInvite = await client_1.default.invites.findFirst({
                where: {
                    email: request.inviteEmail,
                    sentById: businessId,
                    OR: [
                        { status: "PENDING" },
                        { status: "ACCEPTED", stillAMember: true }
                    ]
                },
            });
            if (existingInvite) {
                throw new error_1.ConflictError("User has already been invited or is already a member");
            }
            await client_1.default.invites.create({
                data: {
                    firstName: request.firstName || '', // Ensure non-null
                    lastName: request.lastName || '', // Ensure non-null
                    email: request.inviteEmail,
                    role: request.role,
                    accessPermissions: request.accessPermissions,
                    sentById: businessId,
                    status: "PENDING", // Explicitly set status
                    stillAMember: false, // Will be set to true when accepted
                },
            });
            const businessData = await client_1.default.business.findFirst({
                where: { id: userdata.businessId }
            });
            if (!businessData)
                throw new error_1.ConflictError("Business does not exist");
            const newInvite = {
                firstName: request.firstName || userdata.firstName,
                lastName: request.lastName || userdata.lastName,
                inviteEmail: request.inviteEmail,
                role: request.role,
                businessId: userdata.businessId,
                workspaceName: businessData.name,
                accessPermissions: request.accessPermissions
            };
            await this.businessUtil.sendInviteEmail(newInvite);
            return {
                message: `Invite sent to ${request.inviteEmail} successfully!`,
            };
        }
        catch (error) {
            console.error(`Error inviting member: ${error}`);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    async acceptInvite(request) {
        console.log('1. Starting acceptInvite service method', { email: request.email });
        try {
            const business = await this.prisma.business.findUnique({
                where: { id: request.businessId }
            });
            if (!business) {
                throw new error_1.ConflictError("Business not found");
            }
            console.log('2. Looking for invite...');
            const invite = await this.prisma.invites.findFirst({
                where: {
                    email: request.email,
                    sentById: request.businessId,
                    status: "PENDING",
                    stillAMember: true
                }
            });
            if (!invite) {
                console.log('4. No invite found');
                throw new error_1.ConflictError("Invalid invite or invite already accepted");
            }
            console.log('3. Invite found:', invite?.id);
            // Check if user already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: request.email }
            });
            let userId;
            if (existingUser) {
                // Update existing user with business relationship
                const updatedUser = await this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        businessId: request.businessId,
                        accountType: "BUSINESS"
                    }
                });
                userId = updatedUser.id;
                console.log(existingUser, invite, "==================EXISTING USER INVITE=========");
            }
            else {
                // Create new user with business relationship
                const newUser = await this.prisma.user.create({
                    data: {
                        email: request.email,
                        firstName: request.firstName,
                        lastName: request.lastName,
                        passwordHash: await this.businessUtil.hashPassword(request.password),
                        businessId: request.businessId,
                        accountType: "BUSINESS"
                    }
                });
                userId = newUser.id;
            }
            // Update invite status with CORRECT userId
            await this.prisma.invites.update({
                where: { id: invite.id },
                data: {
                    status: "ACCEPTED",
                    stillAMember: true,
                    userId: userId, // ✅ Use the actual user ID, not businessId
                    accepted: true,
                    acceptedAt: new Date(),
                    firstName: request.firstName,
                    lastName: request.lastName,
                }
            });
            // Add user as participant to existing conversations
            if (existingUser) {
                await invite_util_1.InviteUtil.addNewInviteAsParticipant(existingUser, invite);
            }
            return {
                message: existingUser
                    ? "Existing user added to business successfully"
                    : "New user created and added to business successfully"
            };
        }
        catch (error) {
            console.error(`Error accepting invite: ${error}`);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    async decodeInvite(token) {
        try {
            const decodedToken = await this.businessUtil.decodeInviteToken(token);
            console.log(decodedToken, "==================DECODE TOKENS=========");
            return decodedToken;
        }
        catch (error) {
            throw new error_1.ConflictError("Invalid or expired token");
        }
    }
}
exports.BusinessService = BusinessService;
