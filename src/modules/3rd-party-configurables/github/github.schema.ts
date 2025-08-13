import { z } from "zod";

export const githubSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string().min(1, "name is required"),
    private: z.boolean(),
    owner: z.string().min(1, "owner is required"),
  })
);
