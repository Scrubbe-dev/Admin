import { z } from "zod";
import { emailSchema } from "../../shared/validation/validation.schema";
import { IncidentTemplate } from "./incident.types";
import {
  BusinessPrefferedIntegration,
  CauseCategory,
  COMMUNICATION_CHANNEL,
  FollowUpStatus,
  IncidentStatus,
  Priority,
} from "@prisma/client";

// incident.schema.ts
// incident.schema.ts - Update submitIncidentSchema

export const submitIncidentSchema = z.object({
  template: z.enum([
    IncidentTemplate.MALWARE,
    IncidentTemplate.NONE,
    IncidentTemplate.PHISHING,
  ]).optional(),
  reason: z.string().min(10, "Provide a valid reason"),
  priority: z.enum([
    Priority.CRITICAL,
    Priority.HIGH,
    Priority.LOW,
    Priority.MEDIUM,
  ]),
  assignedTo: emailSchema.optional(),
  userName: z.string().min(1, "username is required"),
  createdFrom: z.enum(["EMAIL", "SLACK", "PORTAL", "PHONE", "OTHERS"]).optional(),
  source: z.enum(["EMAIL", "SLACK", "PORTAL", "PHONE", "OTHERS"]),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().min(1, "Sub-category is required"),
  description: z.string().min(1, "Description is required"),
  impact: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["OPEN", "ACKNOWLEDGED", "INVESTIGATION", "MITIGATED", "RESOLVED", "CLOSED"]),
  MTTR: z.string().min(1, "MTTR is required"),
  suggestionFix: z.string().optional(),
  escalate: z.string().optional(),
  affectedSystem: z.string().optional(),
  ticketId: z.string().optional(), // Add this line - make it optional
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

// =============== RESOLUTION STEPS ===============
const rootCauseAnalysisSchema = z.object({
  causeCategory: z.nativeEnum(CauseCategory),
  rootCause: z.string().min(1, "Root cause is required"),
  fiveWhys: z.object({
    why1: z.string().min(1),
    why2: z.string().min(1),
    why3: z.string().min(1),
    why4: z.string().min(1),
    why5: z.string().min(1),
  }),
});

const resolutiondetailsSchema = z.object({
  temporaryFix: z.string().min(1, "Temporary fix is required"),
  permanentFix: z.string().min(1, "Permanent fix is required"),
});

const knowledgeDraftSchema = z.object({
  internalKb: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    identificationSteps: z.string().min(1),
    resolutionSteps: z.string().min(1),
    preventiveMeasures: z.string().min(1),
    tags: z.array(z.string()).min(1),
  }),
});

const followUpActionsSchema = z.object({
  task: z.string().min(1),
  owner: z.string().min(1),
  dueDate: z.coerce.date(),
  status: z.nativeEnum(FollowUpStatus),
  ticketingSystems: z.array(z.nativeEnum(BusinessPrefferedIntegration)).min(1),
});

const stackHolderSchema = z.object({
  communicationChannel: z.nativeEnum(COMMUNICATION_CHANNEL),
  targetStakeholders: z.array(z.string()).min(1),
  messageContent: z.string().min(1),
});

export const resolutionSchema = z.object({
  rootCauseAnalysis: rootCauseAnalysisSchema,
  resolutionDetails: resolutiondetailsSchema,
  knowledgeDraft: knowledgeDraftSchema,
  followUpActions: followUpActionsSchema,
  stakeHolder: stackHolderSchema,
});

export const customerFacingKbSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
});
