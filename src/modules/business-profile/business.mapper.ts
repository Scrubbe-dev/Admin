import { Invites, User } from "@prisma/client";
import { Members } from "./business.types";

export class BusinessMapper {
  constructor() {}

  static toNameAndEmail(invite: Invites): Members {
    return {
      id: invite.userId ,
      firstname: invite.firstName,
      lastname: invite.lastName,
      email: invite.email,
    };
  }

  static userToMember(user: { firstName: string | null; lastName: string | null; email: string }): Members {
    return {
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
    };
  }
}