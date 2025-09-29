"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../error");
const invite_util_1 = require("../../invite/invite.util");
const auth_mapper_1 = require("../mapper/auth.mapper");
// run changes to production db with this command - npx prisma migrate deploy
//  run changes to dev db with this command - npx prisma migrate dev --name added-this-feature
class AuthService {
    prisma;
    tokenService;
    securityUtils;
    emailService;
    constructor(prisma, tokenService, securityUtils, emailService) {
        this.prisma = prisma;
        this.tokenService = tokenService;
        this.securityUtils = securityUtils;
        this.emailService = emailService;
    }
    async registerDev(input) {
        try {
            const exists = await this.prisma.user.findUnique({
                where: { email: input.email },
            });
            if (exists) {
                throw new error_1.ConflictError("Email already in use");
            }
            const passwordHash = await this.securityUtils.hashPassword(input.password);
            const user = await this.prisma.user.create({
                data: {
                    firstName: input.firstName,
                    lastName: input.lastName,
                    email: input.email,
                    passwordHash,
                    role: client_1.Role.USER,
                    accountType: client_1.AccountType.DEVELOPER,
                    developer: {
                        create: {
                            experience: input.experienceLevel,
                            githubUsername: input.githubUsername,
                        },
                    },
                },
            });
            await invite_util_1.InviteUtil.acceptInvite(user.email, user);
            const businessId = await invite_util_1.InviteUtil.getInvitedBusinessId(user.email);
            const tokens = await this.tokenService.generateTokens(user, businessId);
            const code = await this.generateAndSaveOTP(user.id, user.email);
            await this.emailService.sendVerificationEmail(user.email, code);
            return auth_mapper_1.AuthMapper.toUserResponse(user, businessId, tokens);
        }
        catch (error) {
            throw new error_1.UnauthorizedError(`Error occured ${error}`);
        }
    }
    async registerBusiness(input) {
        try {
            const exists = await this.prisma.user.findUnique({
                where: { email: input.email },
            });
            if (exists) {
                throw new error_1.ConflictError("Email already in use");
            }
            const passwordHash = await this.securityUtils.hashPassword(input.password);
            const user = await this.prisma.user.create({
                data: {
                    email: input.email,
                    passwordHash,
                    accountType: client_1.AccountType.BUSINESS,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    role: client_1.Role.ADMIN,
                    business: {
                        create: {
                            address: input.businessAddress,
                            companySize: input.companySize,
                            purpose: input.purpose,
                        },
                    },
                },
                include: {
                    business: true,
                },
            });
            const tokens = await this.tokenService.generateTokens(user, user.business?.id);
            const code = await this.generateAndSaveOTP(user.id, user.email);
            await this.emailService.sendVerificationEmail(user.email, code);
            return auth_mapper_1.AuthMapper.toUserResponse(user, user.business?.id, tokens);
        }
        catch (error) {
            throw new error_1.UnauthorizedError(`Error occured ${error}`);
        }
    }
    async registerDevByOauth(input) {
        try {
            const exists = await this.prisma.user.findUnique({
                where: {
                    email: input.email,
                },
            });
            if (exists) {
                throw new error_1.ConflictError(`Email already in use${exists.registerdWithOauth
                    ? ", please log in with " + input.oAuthProvider
                    : ""}`);
            }
            const newUser = await this.prisma.user.create({
                data: {
                    oauthprovider: input.oAuthProvider,
                    oauthProvider_uuid: input.id,
                    isVerified: input.isVerified,
                    registerdWithOauth: true,
                    email: input.email,
                    profileImage: input.image,
                    accountType: client_1.AccountType.DEVELOPER,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    role: client_1.Role.USER,
                },
            });
            const acceptedInvite = await invite_util_1.InviteUtil.acceptInvite(newUser.email, newUser);
            const tokens = await this.tokenService.generateTokens(newUser, acceptedInvite.businessId);
            return auth_mapper_1.AuthMapper.toUserResponse(newUser, acceptedInvite.businessId, tokens);
        }
        catch (error) {
            throw new error_1.UnauthorizedError(`Error occured ${error}`);
        }
    }
    async registerBusinessByOauth(input) {
        try {
            const exists = await this.prisma.user.findUnique({
                where: {
                    email: input.email,
                },
            });
            if (exists) {
                throw new error_1.ConflictError(`Email already in use${exists.registerdWithOauth
                    ? ", please log in with " + input.oAuthProvider
                    : ""}`);
            }
            const newUser = await this.prisma.user.create({
                data: {
                    oauthprovider: input.oAuthProvider,
                    oauthProvider_uuid: input.id,
                    registerdWithOauth: true,
                    isVerified: input.isVerified,
                    profileImage: input.image,
                    email: input.email,
                    accountType: client_1.AccountType.BUSINESS,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    role: client_1.Role.ADMIN,
                    business: {
                        create: {
                            address: input.businessAddress,
                            companySize: input.companySize,
                            purpose: input.purpose,
                        },
                    },
                },
                include: { business: true },
            });
            const tokens = await this.tokenService.generateTokens(newUser, newUser.business?.id);
            return auth_mapper_1.AuthMapper.toUserResponse(newUser, newUser.business?.id, tokens);
        }
        catch (error) {
            throw new error_1.UnauthorizedError(`Error occured ${error}`);
        }
    }
    async verifyEmail(request) {
        try {
            const otp = await this.prisma.verificationOTP.findFirst({
                where: {
                    userId: request.userId,
                    code: request.code,
                    used: false,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            if (!otp) {
                throw new error_1.UnauthorizedError("Invalid or used OTP");
            }
            if (otp.expiresAt < new Date()) {
                throw new error_1.UnauthorizedError("OTP is expired");
            }
            await this.prisma.verificationOTP.update({
                where: { id: otp.id },
                data: { used: true },
            });
            // Update user verification field
            await this.prisma.user.update({
                where: { id: otp.userId },
                data: { isVerified: true },
            });
            return {
                message: "OTP verified successfully!",
            };
        }
        catch (error) {
            throw new error_1.UnauthorizedError(`Error occured ${error}`);
        }
    }
    async resendOTP(input) {
        const RESEND_COOLDOWN_SECONDS = 60;
        try {
            const userOtp = await this.prisma.verificationOTP.findFirst({
                where: { userId: input.userId },
                orderBy: {
                    createdAt: "desc",
                },
            });
            if (!userOtp) {
                throw new error_1.UnauthorizedError("No OTP request found for this user");
            }
            const now = Date.now();
            const lastSent = new Date(userOtp.updatedAt).getTime();
            if (now - lastSent < RESEND_COOLDOWN_SECONDS * 1000) {
                const waitTime = RESEND_COOLDOWN_SECONDS - Math.floor((now - lastSent) / 1000);
                throw new error_1.ConflictError(`Please wait ${waitTime}s before resending OTP`);
            }
            await this.resendVerificationOTP(userOtp.userId);
            return {
                message: "OTP resent successfully!",
            };
        }
        catch (error) {
            throw new error_1.UnauthorizedError(`Error occured ${error}`);
        }
    }
    async generateAndSaveOTP(userId, sentTo) {
        const code = this.emailService.generateVerificationOTP();
        const otp = await this.prisma.verificationOTP.create({
            data: {
                code,
                userId,
                sentTo,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
            },
        });
        return otp.code;
    }
    async resendVerificationOTP(userId) {
        const code = this.emailService.generateVerificationOTP();
        const otp = await this.prisma.verificationOTP.update({
            where: { userId: userId },
            data: {
                code,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
                updatedAt: new Date(), // force updated at refresh
            },
        });
        await this.emailService.sendVerificationEmail(otp.sentTo, code);
    }
    async login(input) {
        const user = await this.prisma.user.findUnique({
            where: { email: input.email },
            include: {
                business: true,
            },
        });
        // if (!user || !user.isActive) {
        //   throw new UnauthorizedError("Invalid credentials");
        // }
        if (!user) {
            throw new error_1.UnauthorizedError("Invalid credentials");
        }
        const isValid = await this.securityUtils.verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
            throw new error_1.UnauthorizedError("Invalid credentials");
        }
        const businessId = await invite_util_1.InviteUtil.getInvitedBusinessId(user.email);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const tokens = await this.tokenService.generateTokens(user, businessId ?? user.business?.id);
        return auth_mapper_1.AuthMapper.toUserResponse(user, businessId ?? user.business?.id, tokens, user?.business?.purpose);
    }
    async oAuthLogin(input) {
        const user = await this.prisma.user.findFirst({
            where: {
                email: input.email,
                oauthprovider: input.oAuthProvider,
                // oauthProvider_uuid: input.provider_uuid, // TODO: replace with a more consistent identifier
            },
            include: {
                business: true,
            },
        });
        if (!user) {
            throw new error_1.NotFoundError("User does not exists, Please sign up first");
        }
        const businessId = await invite_util_1.InviteUtil.getInvitedBusinessId(user.email);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
            },
        });
        const tokens = await this.tokenService.generateTokens(user, businessId ?? user.business?.id);
        return auth_mapper_1.AuthMapper.toUserResponse(user, businessId ?? user.business?.id, tokens, user?.business?.purpose);
    }
    async refreshTokens(refreshToken) {
        return this.tokenService.refreshTokens(refreshToken);
    }
    async logout(refreshToken) {
        await this.tokenService.revokeRefreshToken(refreshToken);
    }
    excludePassword(user) {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    // In AuthService class
    async forgotPassword(input) {
        try {
            // Find user by email
            const user = await this.prisma.user.findUnique({
                where: { email: input.email },
            });
            // Always return the same message regardless of whether the user exists
            // to prevent email enumeration attacks
            if (!user) {
                return { message: "If your email is registered, you will receive a password reset link" };
            }
            // Check if user is active
            if (!user.isActive) {
                return { message: "If your email is registered, you will receive a password reset link" };
            }
            // Check if user registered with OAuth (no password set)
            if (user.registerdWithOauth || !user.passwordHash) {
                return { message: "If your email is registered, you will receive a password reset link" };
            }
            // Generate a secure random token
            const token = this.securityUtils.generateRandomToken(32);
            // Calculate expiration time (1 hour from now)
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            // Store the reset token in the database
            await this.prisma.resetToken.create({
                data: {
                    userId: user.id,
                    email: user.email,
                    token,
                    type: 'RESET_LINK',
                    expiresAt,
                },
            });
            // Send password reset email
            await this.emailService.sendPasswordResetEmail(user.email, token);
            return { message: "If your email is registered, you will receive a password reset link" };
        }
        catch (error) {
            // Log the error but return a generic message to prevent information leakage
            console.error(`Error in forgotPassword: ${error}`);
            return { message: "If your email is registered, you will receive a password reset link" };
        }
    }
    async resetPassword(input) {
        try {
            // Find the reset token
            const resetToken = await this.prisma.resetToken.findFirst({
                where: { token: input.token },
                include: { user: true },
            });
            // Check if token exists
            if (!resetToken) {
                throw new error_1.UnauthorizedError("Invalid or expired reset token");
            }
            // Check if token is expired
            if (resetToken.expiresAt < new Date()) {
                throw new error_1.UnauthorizedError("Reset token has expired");
            }
            // Check if token has already been used
            if (resetToken.usedAt) {
                throw new error_1.UnauthorizedError("Reset token has already been used");
            }
            // Check token type
            if (resetToken.type !== 'RESET_LINK') {
                throw new error_1.UnauthorizedError("Invalid token type");
            }
            // Check if user exists and is active
            if (!resetToken.id || !resetToken) {
                throw new error_1.UnauthorizedError("User account is not active");
            }
            // Hash the new password
            const newPasswordHash = await this.securityUtils.hashPassword(input.password);
            // Update user password
            await this.prisma.user.update({
                where: { id: resetToken.userId },
                data: {
                    passwordHash: newPasswordHash,
                    passwordChangedAt: new Date(),
                },
            });
            // Mark the token as used
            await this.prisma.resetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            });
            // Revoke all refresh tokens for security
            await this.prisma.refreshToken.updateMany({
                where: { userId: resetToken.userId },
                data: { revokedAt: new Date() },
            });
            // Send password change confirmation email
            await this.emailService.sendPasswordChangedConfirmation(resetToken?.email);
            return { message: "Password has been reset successfully" };
        }
        catch (error) {
            throw new error_1.UnauthorizedError(`Error resetting password: ${error}`);
        }
    }
    async validateResetToken(input) {
        try {
            // Find the reset token
            const resetToken = await this.prisma.resetToken.findFirst({
                where: { token: input.token },
            });
            // Check if token exists
            if (!resetToken) {
                return { valid: false, message: "Invalid reset token" };
            }
            // Check if token is expired
            if (resetToken.expiresAt < new Date()) {
                return { valid: false, message: "Reset token has expired" };
            }
            // Check if token has already been used
            if (resetToken.usedAt) {
                return { valid: false, message: "Reset token has already been used" };
            }
            // Check token type
            if (resetToken.type !== 'RESET_LINK') {
                return { valid: false, message: "Invalid token type" };
            }
            return { valid: true };
        }
        catch (error) {
            return { valid: false, message: "Error validating reset token" };
        }
    }
    ;
    // Add this method to your AuthService class
    async changePassword(userId, input) {
        try {
            // Get user with password hash
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true, passwordChangedAt: true }
            });
            if (!user || !user.passwordHash) {
                throw new error_1.UnauthorizedError("User not found or password not set");
            }
            // Verify current password
            const isCurrentPasswordValid = await this.securityUtils.verifyPassword(input.currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new error_1.UnauthorizedError("Current password is incorrect");
            }
            // Check if new password is same as current
            const isNewPasswordSame = await this.securityUtils.verifyPassword(input.newPassword, user.passwordHash);
            if (isNewPasswordSame) {
                throw new error_1.ConflictError("New password must be different from current password");
            }
            // Hash the new password
            const newPasswordHash = await this.securityUtils.hashPassword(input.newPassword);
            // Update user password
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash: newPasswordHash,
                    passwordChangedAt: new Date()
                }
            });
            // Revoke all refresh tokens for security
            await this.prisma.refreshToken.updateMany({
                where: { userId },
                data: { revokedAt: new Date() }
            });
            return { message: "Password changed successfully" };
        }
        catch (error) {
            throw new error_1.UnauthorizedError(`Error changing password: ${error}`);
        }
    }
}
exports.AuthService = AuthService;
