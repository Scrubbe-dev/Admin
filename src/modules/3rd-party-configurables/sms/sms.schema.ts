import { z } from "zod";

export const configureSMSschema = z.object({
  accountSid: z.string().min(1, "Account sid is required"),
  authToken: z.string().min(1, "Auth token is required"),
  fromNumber: z.string().min(10, "Please provide a valid phone number"),
});
