import { PrismaClient, User, Role } from '@prisma/client';
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  Tokens,
} from '../types/auth.types';
import { TokenService } from './token.service';
import { SecurityUtils } from '../utils/security.utils';
import { EmailService } from './email.service';
import { ConflictError, UnauthorizedError, NotFoundError } from '../error';

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private tokenService: TokenService,
    private emailService: EmailService,
    private securityUtils: SecurityUtils
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    console.log(input)
    const exists = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (exists) {
      throw new ConflictError('Email already in use');
    }
    const passwordHash = await this.securityUtils.hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        experience: input.experience,
        username: input.username,
        role:Role.USER,
      },
    });
    const tokens = await this.tokenService.generateTokens(user as any);
    // await this.emailService.sendVerificationEmail(user.email);
    console.log(tokens)
    return {
      user: this.excludePassword(user) as any,
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await this.securityUtils.verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
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

  private excludePassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}