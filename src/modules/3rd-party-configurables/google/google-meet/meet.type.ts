import { User, UserThirdpartyIntegration } from "@prisma/client";

export type GenerateMeetingLinkResult = {
  meetingLink: string;
  integration: UserThirdpartyIntegration & { user: User };
};
