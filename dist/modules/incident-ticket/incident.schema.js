"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerFacingKbSchema = exports.resolutionSchema = exports.commentSchema = exports.updateTicketSchema = exports.submitIncidentSchema = void 0;
const zod_1 = require("zod");
const validation_schema_1 = require("../../shared/validation/validation.schema");
const incident_types_1 = require("./incident.types");
const client_1 = require("@prisma/client");
// incident.schema.ts
exports.submitIncidentSchema = zod_1.z.object({
    template: zod_1.z.enum([
        incident_types_1.IncidentTemplate.MALWARE,
        incident_types_1.IncidentTemplate.NONE,
        incident_types_1.IncidentTemplate.PHISHING,
    ]).optional(),
    reason: zod_1.z.string().min(10, "Provide a valid reason"),
    priority: zod_1.z.enum([
        client_1.Priority.CRITICAL,
        client_1.Priority.HIGH,
        client_1.Priority.LOW,
        client_1.Priority.MEDIUM,
    ]),
    assignedTo: validation_schema_1.emailSchema.optional(), // Make this optional
    userName: zod_1.z.string().min(1, "username is required"),
    createdFrom: zod_1.z.enum(["EMAIL", "SLACK", "PORTAL", "PHONE", "OTHERS"]).optional(),
    // Add the new required fields
    source: zod_1.z.enum(["EMAIL", "SLACK", "PORTAL", "PHONE", "OTHERS"]),
    category: zod_1.z.string().min(1, "Category is required"),
    subCategory: zod_1.z.string().min(1, "Sub-category is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    impact: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    status: zod_1.z.enum(["OPEN", "ACKNOWLEDGED", "INVESTIGATION", "MITIGATED", "RESOLVED", "CLOSED"]),
    MTTR: zod_1.z.string().min(1, "MTTR is required"),
    suggestionFix: zod_1.z.string().optional(),
    escalate: zod_1.z.string().optional(),
    affectedSystem: zod_1.z.string().optional(),
});
exports.updateTicketSchema = zod_1.z.object({
    template: zod_1.z.enum([
        incident_types_1.IncidentTemplate.MALWARE,
        incident_types_1.IncidentTemplate.NONE,
        incident_types_1.IncidentTemplate.PHISHING,
    ]),
    reason: zod_1.z.string().min(10, "Provide a valid reason"),
    priority: zod_1.z.enum([
        client_1.Priority.CRITICAL,
        client_1.Priority.HIGH,
        client_1.Priority.LOW,
        client_1.Priority.MEDIUM,
    ]),
    assignedTo: validation_schema_1.emailSchema,
    username: zod_1.z.string().min(1, "username is required"),
    incidentId: zod_1.z.string().uuid(),
    status: zod_1.z.enum([
        client_1.IncidentStatus.CLOSED,
        client_1.IncidentStatus.IN_PROGRESS,
        client_1.IncidentStatus.ON_HOLD,
        client_1.IncidentStatus.OPEN,
        client_1.IncidentStatus.RESOLVED,
    ]),
});
exports.commentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "content cannot be empty"),
});
// =============== RESOLUTION STEPS ===============
const rootCauseAnalysisSchema = zod_1.z.object({
    causeCategory: zod_1.z.nativeEnum(client_1.CauseCategory),
    rootCause: zod_1.z.string().min(1, "Root cause is required"),
    fiveWhys: zod_1.z.object({
        why1: zod_1.z.string().min(1),
        why2: zod_1.z.string().min(1),
        why3: zod_1.z.string().min(1),
        why4: zod_1.z.string().min(1),
        why5: zod_1.z.string().min(1),
    }),
});
const resolutiondetailsSchema = zod_1.z.object({
    temporaryFix: zod_1.z.string().min(1, "Temporary fix is required"),
    permanentFix: zod_1.z.string().min(1, "Permanent fix is required"),
});
const knowledgeDraftSchema = zod_1.z.object({
    internalKb: zod_1.z.object({
        title: zod_1.z.string().min(1),
        summary: zod_1.z.string().min(1),
        identificationSteps: zod_1.z.string().min(1),
        resolutionSteps: zod_1.z.string().min(1),
        preventiveMeasures: zod_1.z.string().min(1),
        tags: zod_1.z.array(zod_1.z.string()).min(1),
    }),
});
const followUpActionsSchema = zod_1.z.object({
    task: zod_1.z.string().min(1),
    owner: zod_1.z.string().min(1),
    dueDate: zod_1.z.coerce.date(),
    status: zod_1.z.nativeEnum(client_1.FollowUpStatus),
    ticketingSystems: zod_1.z.array(zod_1.z.nativeEnum(client_1.BusinessPrefferedIntegration)).min(1),
});
const stackHolderSchema = zod_1.z.object({
    communicationChannel: zod_1.z.nativeEnum(client_1.COMMUNICATION_CHANNEL),
    targetStakeholders: zod_1.z.array(zod_1.z.string()).min(1),
    messageContent: zod_1.z.string().min(1),
});
exports.resolutionSchema = zod_1.z.object({
    rootCauseAnalysis: rootCauseAnalysisSchema,
    resolutionDetails: resolutiondetailsSchema,
    knowledgeDraft: knowledgeDraftSchema,
    followUpActions: followUpActionsSchema,
    stakeHolder: stackHolderSchema,
});
exports.customerFacingKbSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    summary: zod_1.z.string().min(1),
});
