import { User } from "@prisma/client";
import { MappedUser, Tokens } from "../types/auth.types";

export class AuthMapper {
  constructor() {}

  static toUserResponse(
    user: User,
    businessId: string | undefined,
    token: Tokens,
    purpose?: any
  ): MappedUser | any {
    return {
      user: {
        id: user.id,
        email: user.email,
        businessId,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        role: user.role,
        roles: [user.role],
        purpose,
      },
      tokens: {
        refreshToken: token.refreshToken,
        accessToken: token.accessToken,
      },
    };
  }
}
