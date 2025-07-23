import {
  PrismaClient,
  User,
  Role,
  AccountType,
  OAuthProvider,
} from "@prisma/client";
import {
  LoginInput,
  AuthResponse,
  Tokens,
  VerifyEmailRequest,
  ResendOtpRequest,
  RegisterDevRequest,
  RegisterBusinessRequest,
  OAuthRequest,
} from "../types/auth.types";
import { TokenService } from "./token.service";
import { SecurityUtils } from "../utils/security.utils";
import { EmailService } from "./email.service";
import { ConflictError, UnauthorizedError, NotFoundError } from "../error";
import { RegisterBusinessByOAth, RegisterByOAth } from "../schemas/auth.schema";

// TODO - run changes to production db with this command - npx prisma migrate deploy
//  run changes to dev db with this command - npx prisma migrate dev --name added-this-feature

// TODO(#4): Validate `isVerified` flag from the OAuth provider.
//              - If `isVerified` is false or missing, initiate OTP verification.
//              - Ensure this check runs before completing user registration.
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private tokenService: TokenService,
    private securityUtils: SecurityUtils,
    private emailService: EmailService
  ) {}

  async registerDev(input: RegisterDevRequest): Promise<AuthResponse | void> {
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
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          passwordHash,
          role: Role.USER,
          accountType: AccountType.DEVELOPER,
          experience: input.experienceLevel,
          username: input.githubUserame,
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

  async registerBusiness(
    input: RegisterBusinessRequest
  ): Promise<AuthResponse | void> {
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
          accountType: AccountType.BUSINESS,
          firstName: input.firstName,
          lastName: input.lastName,
          address: input.businessAddress,
          companySize: input.companySize,
          purpose: input.purpose,
          // role: Role.USER,
          role: Role.ADMIN,
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

  async registerDevByOauth(input: OAuthRequest) {
    try {
      const exists = await this.prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (exists) {
        throw new ConflictError(
          `Email already in use${
            exists.registerdWithOauth
              ? ", please log in with " + input.oAuthProvider
              : ""
          }`
        );
      }

      const newUser = await this.prisma.user.create({
        data: {
          oauthprovider: input.oAuthProvider as unknown as OAuthProvider,
          oauthProvider_uuid: input.id,
          isVerified: input.isVerified,
          registerdWithOauth: true,
          image: input.image,
          email: input.email,
          accountType: AccountType.DEVELOPER,
          firstName: input.firstName,
          lastName: input.lastName,
          role: Role.USER,
        },
      });

      const tokens = this.tokenService.generateTokens(newUser as any);

      return {
        user: this.excludePassword(newUser),
        tokens,
      };
    } catch (error) {
      throw new UnauthorizedError(`Error occured ${error}`);
    }
  }

  async registerBusinessByOauth(input: OAuthRequest) {
    try {
      const exists = await this.prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (exists) {
        throw new ConflictError(
          `Email already in use${
            exists.registerdWithOauth
              ? ", please log in with " + input.oAuthProvider
              : ""
          }`
        );
      }

      const newUser = await this.prisma.user.create({
        data: {
          oauthprovider: input.oAuthProvider as unknown as OAuthProvider,
          oauthProvider_uuid: input.id,
          registerdWithOauth: true,
          isVerified: input.isVerified,
          image: input.image,
          email: input.email,
          accountType: AccountType.BUSINESS,
          firstName: input.firstName,
          lastName: input.lastName,
          role: Role.ADMIN,
        },
      });

      const tokens = this.tokenService.generateTokens(newUser as any);

      return {
        user: this.excludePassword(newUser),
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
      user.passwordHash as string
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
