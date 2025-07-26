import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { User, Tokens, JwtPayload } from "../types/auth.types";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { UnauthorizedError } from "../error";

export class TokenService {
  constructor(
    private prisma: PrismaClient,
    private jwtSecret: string,
    private jwtExpiresIn: string,
    private refreshTokenExpiresInDays: number
  ) {}

  async generateTokens(user: User): Promise<Tokens> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      // corrected from secs to mins -> added '*60'
      exp: Math.floor(Date.now() / 1000) + parseInt(this.jwtExpiresIn) * 60,
    };

    const jwtSign = jwt.sign(payload, this.jwtSecret);
    return jwtSign;
  }

  private async generateRefreshToken(user: User): Promise<string> {
    const token = uuidv4();
    const expiresAt = addDays(new Date(), this.refreshTokenExpiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    return token;
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Revoke the current refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(tokenRecord.user as unknown as User);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const verify = jwt.verify(token, this.jwtSecret) as JwtPayload;
      
      return verify;
    } catch (err) {
      throw new UnauthorizedError("Invalid access token");
    }
  }
}
