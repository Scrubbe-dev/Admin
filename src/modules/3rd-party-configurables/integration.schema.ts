import { z } from "zod";

export const defaultChannelSchema = z.object({
  channelId: z.string(),
});
