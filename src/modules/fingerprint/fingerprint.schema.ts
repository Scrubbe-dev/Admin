import { z } from "zod";
import { PackageModule } from "@prisma/client";

export const fingerprintConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  enviroment: z.string().min(1, "Environment is required"),
  domain: z
    .string()
    .regex(
      /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
      "Domain must be a valid hostname (e.g., example.com)"
    )
    .optional(),
  description: z.string().optional(),
  package: z.nativeEnum(PackageModule, {
    required_error: "Package is required",
    invalid_type_error: "Invalid package type",
  }),
});
