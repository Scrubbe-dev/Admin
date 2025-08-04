import { Invites } from "@prisma/client";
import { Members } from "./business.types";

export class BusinessMapper {
  constructor() {}

  static toNameAndEmail(invite: Invites): Members {
    return {
      firstname: invite.firstName,
      lastname: invite.lastName,
      email: invite.email,
    };
  }
}
