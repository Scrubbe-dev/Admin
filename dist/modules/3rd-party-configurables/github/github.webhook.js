"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubWebhookService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = __importDefault(require("../../../prisma-clients/client"));
const client_2 = require("@prisma/client");
const github_config_1 = require("../../../config/github.config");
const incident_service_1 = require("../../incident-ticket/incident.service");
const incident_types_1 = require("../../incident-ticket/incident.types");
const error_1 = require("../../auth/error");
class GithubWebhookService {
    incidentService;
    constructor(incidentService = new incident_service_1.IncidentService()) {
        this.incidentService = incidentService;
    }
    verifySignature(req) {
        const signature = req.header("X-Hub-Signature-256");
        if (!signature)
            return false;
        const payload = JSON.stringify(req.body);
        const hmac = crypto_1.default
            .createHmac("sha256", github_config_1.githubConfig.webhookSecret)
            .update(payload)
            .digest("hex");
        const expectedSignature = `sha256=${hmac}`;
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    async handleEvent(event, payload, userId) {
        console.log("GitHub Webhook Event:", event);
        if (event === "deployment_status" &&
            payload.deployment_status?.state === "failure") {
            await this.triggerIncidentFromEvent("Deployment failed", payload, userId);
        }
        if (event === "workflow_run" &&
            payload.workflow_run?.conclusion === "failure") {
            await this.triggerIncidentFromEvent("CI/CD Workflow failed", payload, userId);
        }
        if (event === "push" &&
            payload.ref?.includes("main") &&
            payload.commits?.length) {
            // also trigger if commit messages contain certain keywords
            const hasFixme = payload.commits.some((c) => /fixme|urgent|critical/i.test(c.message));
            if (hasFixme) {
                await this.triggerIncidentFromEvent("Critical commit pushed", payload, userId);
            }
        }
        // add more gitHub event handling here if needed
    }
    async triggerIncidentFromEvent(reason, payload, userId) {
        const repoName = payload.repository?.full_name;
        const repoUrl = payload.repository?.html_url;
        console.log(`🚨 Triggering Incident for ${repoName} — ${reason}`);
        const integration = await client_1.default.userThirdpartyIntegration.findFirst({
            where: {
                provider: client_2.BusinessNotificationChannels.GITHUB,
                metadata: {
                    path: ["repos"],
                    array_contains: [
                        {
                            name: payload.repository?.name,
                            owner: payload.repository?.owner?.login,
                        },
                    ],
                },
            },
            include: {
                user: {
                    include: {
                        business: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });
        if (!integration) {
            console.warn("⚠ No Github Integration found for this user");
            throw new error_1.NotFoundError("⚠ No Github Integration found for this user");
        }
        const businessId = integration.user.business?.id;
        if (!businessId) {
            console.warn("⚠ No business found for repo:", repoName);
            throw new error_1.NotFoundError("⚠ No business found for repo: " + repoName);
        }
        if (!integration.assignedToEmail) {
            throw new error_1.ConflictError("Please configure a default email to assign github raised incidents as there have been a failed deployement");
        }
        const request = {
            template: incident_types_1.IncidentTemplate.NONE,
            reason: reason + `\n url: ${repoUrl}`,
            priority: client_2.Priority.MEDIUM,
            userName: "github deployment",
            assignedTo: integration.assignedToEmail,
            createdFrom: "GITHUB",
        };
        await this.incidentService.submitIncident(request, userId, businessId);
        console.log(`✅ Incident created for ${repoName} (${businessId})`);
    }
}
exports.GithubWebhookService = GithubWebhookService;
