import { z } from "zod";
import { emailSchema } from "../../shared/validation/validation.schema";
import {
  AccessPermissions,
  DashboardType,
  NotificationChannels,
  PrefferedIntegration,
} from "./business.types";
import { Priority, Role } from "@prisma/client";

const inviteMembersSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  inviteEmail: emailSchema,
  role: z.nativeEnum(Role, {
    invalid_type_error: "Invalid role",
  }),
  accessPermissions: z
    .array(
      z.nativeEnum(AccessPermissions, {
        invalid_type_error: "Invalid Access permission",
      })
    )
    .min(1, "At least one access permission is required"),
});

export const dashboardPreferenceSchema = z.object({
  colorScheme: z.string().min(1, "Color scheme is required"),
  defaultDashboard: z.nativeEnum(DashboardType, {
    required_error: "Default dashboard is required",
    invalid_type_error: "Invalid dashboard type",
  }),
  preferredIntegration: z.array(z.nativeEnum(PrefferedIntegration, {
    required_error: "Preferred integration is required",
    invalid_type_error: "Invalid integration type",
  })),
  notificationChannels: z
    .array(
      z.nativeEnum(NotificationChannels, {
        invalid_type_error: "Invalid notification channel",
      })
    )
    .min(1, "At least one notification channel is required"),
  defaultPriority: z.nativeEnum(Priority, {
    required_error: "Priority is required",
    invalid_type_error: "Invalid priority",
  }),
});

export const businessSetUpSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  companySize: z.string().min(1, "Company size is required"),
  primaryRegion: z.string().min(1, "Primary region is required"),
  companyLogo: z.string().optional(),

  // Admin info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  adminEmail: emailSchema,
  adminJobTitle: z.string().min(1, "Job title is required"),

  // Invite team members (optional array)
  inviteMembers: z.array(inviteMembersSchema).max(2, "Maximum of 2 invites are allowed").optional(),

  dashboardPreference: dashboardPreferenceSchema.optional(),
});
