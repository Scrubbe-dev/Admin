import { z } from "zod";
import { emailSchema } from "../../../shared/validation/validation.schema";

export const gitlabRepoSchema = z.object({
  assignTo: emailSchema,
  repos: z.array(
    z.object({
      id: z.number(),
      name: z.string().min(1),
      path_with_namespace: z.string().min(1),
    })
  ),
});

export type GitLabRepoRequest = z.infer<typeof gitlabRepoSchema>;
