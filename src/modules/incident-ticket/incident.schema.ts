import { z } from "zod";
import { emailSchema } from "../../shared/validation/validation.schema";
import { IncidentTemplate } from "./incident.types";
import { IncidentStatus, Priority } from "@prisma/client";

export const submitIncidentSchema = z.object({
  template: z.enum([
    IncidentTemplate.MALWARE,
    IncidentTemplate.NONE,
    IncidentTemplate.PHISHING,
  ]),
  reason: z.string().min(10, "Provide a valid reason"),
  priority: z.enum([
    Priority.CRITICAL,
    Priority.HIGH,
    Priority.LOW,
    Priority.MEDIUM,
  ]),
  assignedTo: emailSchema,
  username: z.string().min(1, "username is required"),
});

export const updateTicketSchema = z.object({
  template: z.enum([
    IncidentTemplate.MALWARE,
    IncidentTemplate.NONE,
    IncidentTemplate.PHISHING,
  ]),
  reason: z.string().min(10, "Provide a valid reason"),
  priority: z.enum([
    Priority.CRITICAL,
    Priority.HIGH,
    Priority.LOW,
    Priority.MEDIUM,
  ]),
  assignedTo: emailSchema,
  username: z.string().min(1, "username is required"),
  incidentId: z.string().uuid(),
  status: z.enum([
    IncidentStatus.CLOSED,
    IncidentStatus.IN_PROGRESS,
    IncidentStatus.ON_HOLD,
    IncidentStatus.OPEN,
    IncidentStatus.RESOLVED,
  ]),
});

export const commentSchema = z.object({
  content: z.string().min(1, "content cannot be empty"),
});
