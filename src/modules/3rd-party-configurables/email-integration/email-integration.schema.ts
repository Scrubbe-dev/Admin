import { z } from "zod";

export const emailIntegrationSchema = z.object({
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens"
    ),
});

export type ConnectEmailIntegrationRequest = z.infer<
  typeof emailIntegrationSchema
>;
