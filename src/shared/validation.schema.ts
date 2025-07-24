import { z } from "zod";

export const emailSchema = z.string().email("Invalid email address").max(255);
