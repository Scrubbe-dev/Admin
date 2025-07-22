import { PrismaClient, User, Role } from "@prisma/client";
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  Tokens,
  VerifyEmailRequest,
  ResendOtpRequest,
} from "../types/auth.types";
import { TokenService } from "./token.service";
import { SecurityUtils } from "../utils/security.utils";
import { EmailService } from "./email.service";
import { ConflictError, UnauthorizedError, NotFoundError } from "../error";
import { NextFunction, Response } from "express";

// TODO - fix error handling
// TODO - run changes to production db with this command - npx prisma migrate deploy
//  npx prisma migrate dev --name modify-verification-otp-schema
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private tokenService: TokenService,
    private securityUtils: SecurityUtils,
    private emailService: EmailService
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse | void> {
    try {
      const exists = await this.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (exists) {
        throw new ConflictError("Email already in use");
      }
      const passwordHash = await this.securityUtils.hashPassword(
        input.password
      );
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          experience: input.experience,
          username: input.username,
          role: Role.USER,
        },
      });
      const tokens = await this.tokenService.generateTokens(user as any);

      const code = await this.generateAndSaveOTP(user.id, user.email);
      await this.emailService.sendVerificationEmail(user.email, code);
      return {
        user: this.excludePassword(user) as any,
        tokens,
      };
    } catch (error) {
      throw new UnauthorizedError(`Error occured ${error}`);
    }
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<{ message: string }> {
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
        throw new UnauthorizedError("Invalid or used OTP");
      }

      if (otp.expiresAt < new Date()) {
        throw new UnauthorizedError("OTP is expired");
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
    } catch (error) {
      throw new UnauthorizedError(`Error occured ${error}`);
    }
  }

  async resendOTP(input: ResendOtpRequest): Promise<{ message: string }> {
    const RESEND_COOLDOWN_SECONDS = 60;

    try {
      const userOtp = await this.prisma.verificationOTP.findFirst({
        where: { userId: input.userId },

        orderBy: {
          createdAt: "desc",
        },
      });

      if (!userOtp) {
        throw new UnauthorizedError("No OTP request found for this user");
      }

      const now = Date.now();
      const lastSent = new Date(userOtp.updatedAt).getTime();

      if (now - lastSent < RESEND_COOLDOWN_SECONDS * 1000) {
        const waitTime =
          RESEND_COOLDOWN_SECONDS - Math.floor((now - lastSent) / 1000);
        throw new ConflictError(
          `Please wait ${waitTime}s before resending OTP`
        );
      }


      await this.resendVerificationOTP(userOtp.userId);

      return {
        message: "OTP resent successfully!",
      };
    } catch (error) {
      throw new UnauthorizedError(`Error occured ${error}`);
    }
  }

  private async generateAndSaveOTP(userId: string, sentTo: string) {
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

  private async resendVerificationOTP(userId: string) {
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

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValid = await this.securityUtils.verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.tokenService.generateTokens(user as any);

    return {
      user: this.excludePassword(user) as any,
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    return this.tokenService.refreshTokens(refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  private excludePassword(user: User): Omit<User, "passwordHash"> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
