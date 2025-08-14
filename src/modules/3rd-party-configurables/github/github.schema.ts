import { z } from "zod";
import { emailSchema } from "../../../shared/validation/validation.schema";

export const githubRepoSchema = z.object({
  assignTo: emailSchema,
  repos: z.array(
    z.object({
      id: z.number(),
      name: z.string().min(1, "name is required"),
      private: z.boolean(),
      owner: z.string().min(1, "owner is required"),
    })
  ),
});

export type GithubRepoRequest = z.infer<typeof githubRepoSchema>;
