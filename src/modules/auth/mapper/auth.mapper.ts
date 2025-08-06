import { User } from "@prisma/client";
import { MappedUser, Tokens } from "../types/auth.types";

export class AuthMapper {
  constructor() {}

  static toUserResponse(
    user: User,
    businessId: string | undefined,
    token: Tokens
  ): MappedUser {
    return {
      user: {
        id: user.id,
        email: user.email,
        businessId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens: {
        refreshToken: token.refreshToken,
        accessToken: token.accessToken,
      },
    };
  }
}
