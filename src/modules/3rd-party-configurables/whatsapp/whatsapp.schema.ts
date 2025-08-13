import { z } from "zod";

export const whatsappSchema = z.object({
  recipients: z.string().array(),
  enabled: z.boolean(),
});
