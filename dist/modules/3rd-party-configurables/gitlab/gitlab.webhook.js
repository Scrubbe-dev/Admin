"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitlabWebhookService = void 0;
const client_1 = __importDefault(require("../../../prisma-clients/client"));
const client_2 = require("@prisma/client");
const incident_service_1 = require("../../incident-ticket/incident.service");
const incident_types_1 = require("../../incident-ticket/incident.types");
const error_1 = require("../../auth/error");
class GitlabWebhookService {
    incident = new incident_service_1.IncidentService();
    async handleEvent(payload, userId) {
        const kind = payload.object_kind;
        console.log("======== KIND ========", kind);
        if (kind === "pipeline") {
            const status = payload.object_attributes?.status; // "success" | "failed"
            const projectPath = payload.project?.path_with_namespace;
            console.log("======== PROJECT PATH ========", projectPath);
            if (status === "failed") {
                const reason = `CI/CD pipeline failed for ${projectPath}`;
                await this.triggerIncidentFromEvent(reason, payload, userId);
            }
        }
        if (kind === "merge_request") {
            const state = payload.object_attributes?.state; // opened/merged/closed
            const merged = payload.object_attributes?.merged;
            const projectPath = payload.project?.path_with_namespace;
            if (merged && state === "merged") {
                // Example: you can choose to create an incident iff a label exists, etc.
                // const labels = payload.labels?.map((l: any) => l.title) || [];
                // if (labels.includes("incident")) { ... }
            }
        }
        // push, deployment hooks can be added similarly
    }
    async triggerIncidentFromEvent(reason, payload, userId) {
        const projectId = payload.project?.id;
        const projectPath = payload.project?.path_with_namespace;
        const repoUrl = payload.project?.web_url;
        const integration = await client_1.default.userThirdpartyIntegration.findFirst({
            where: {
                provider: client_2.BusinessNotificationChannels.GITLAB,
                userId,
                metadata: {
                    path: ["projects"],
                    array_contains: [{ id: projectId, path_with_namespace: projectPath }],
                },
            },
            include: {
                user: {
                    include: {
                        business: { select: { id: true } },
                    },
                },
            },
        });
        if (!integration?.user?.business?.id) {
            console.warn("⚠ No business found for GitLab project:", projectPath);
            throw new error_1.NotFoundError("No business found for GitLab project: " + projectPath);
        }
        const businessId = integration.user.business.id;
        if (!integration.assignedToEmail) {
            throw new error_1.ConflictError("Please configure a default email to assign gitlab raised incidents as there have been a failed deployement");
        }
        const request = {
            template: incident_types_1.IncidentTemplate.NONE,
            reason: `${reason}\nurl: ${repoUrl}`,
            priority: client_2.Priority.MEDIUM,
            userName: "gitlab webflow",
            assignedTo: integration.assignedToEmail,
            createdFrom: "GITLAB",
        };
        await this.incident.submitIncident(request, userId, businessId);
        console.log(`✅ Incident created for ${projectPath} (${businessId})`);
    }
}
exports.GitlabWebhookService = GitlabWebhookService;
