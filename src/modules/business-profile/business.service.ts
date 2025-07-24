import { PrismaClient } from "@prisma/client";
import { EmailServices } from "../password-reset/email.services";
import { BusinessSetUpRequest } from "./business.types";

export class BusinessService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailServices
  ) {}
  async businessSetUp(
    request: BusinessSetUpRequest
  ): Promise<{ message: string }> {
    // implement logic
    return this.prisma.$transaction(async (tx) => {
      return { message: "Successful!" };
    });
  }
}
