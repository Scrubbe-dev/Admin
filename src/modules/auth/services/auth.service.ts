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

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private tokenService: TokenService,
    private securityUtils: SecurityUtils,
    private emailService: EmailService
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse | void> {
    try {
      // console.log(input);
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

      const code = await this.generateAndSaveOTP(user.id);
      await this.emailService.sendVerificationEmail(user.email, code);
      // console.log(tokens)
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
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: input.email },

        orderBy: {
          createdAt: "desc",
        },
      });

      if (!user) {
        throw new ConflictError("User does not exist");
      }

      const code = await this.generateAndSaveOTP(user.id);
      await this.emailService.sendVerificationEmail(user.email, code);

      return {
        message: "OTP verified successfully!",
      };
    } catch (error) {
      throw new UnauthorizedError(`Error occured ${error}`);
    }
  }

  private async generateAndSaveOTP(userId: string) {
    const code = this.emailService.generateVerificationOTP();

    const otp = await this.prisma.verificationOTP.create({
      data: {
        code,
        userId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
      },
    });

    return otp.code;
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
