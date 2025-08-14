import crypto from "crypto";
import { Request } from "express";
import prisma from "../../../prisma-clients/client";
import { BusinessNotificationChannels, Priority } from "@prisma/client";
import { githubConfig } from "../../../config/github.config";
import { IncidentService } from "../../incident-ticket/incident.service";
import {
  IncidentRequest,
  IncidentTemplate,
} from "../../incident-ticket/incident.types";
import { ConflictError, NotFoundError } from "../../auth/error";

export class GithubWebhookService {
  constructor(
    private incidentService: IncidentService = new IncidentService()
  ) {}

  verifySignature(req: Request): boolean {
    const signature = req.header("X-Hub-Signature-256");
    if (!signature) return false;

    const payload = JSON.stringify(req.body);
    const hmac = crypto
      .createHmac("sha256", githubConfig.webhookSecret)
      .update(payload)
      .digest("hex");

    const expectedSignature = `sha256=${hmac}`;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async handleEvent(event: string, payload: any, userId: string) {
    console.log("GitHub Webhook Event:", event);

    if (
      event === "deployment_status" &&
      payload.deployment_status?.state === "failure"
    ) {
      await this.triggerIncidentFromEvent("Deployment failed", payload, userId);
    }

    if (
      event === "workflow_run" &&
      payload.workflow_run?.conclusion === "failure"
    ) {
      await this.triggerIncidentFromEvent(
        "CI/CD Workflow failed",
        payload,
        userId
      );
    }

    if (
      event === "push" &&
      payload.ref?.includes("main") &&
      payload.commits?.length
    ) {
      // also trigger if commit messages contain certain keywords
      const hasFixme = payload.commits.some((c: any) =>
        /fixme|urgent|critical/i.test(c.message)
      );
      if (hasFixme) {
        await this.triggerIncidentFromEvent(
          "Critical commit pushed",
          payload,
          userId
        );
      }
    }

    // add more gitHub event handling here if needed
  }

  private async triggerIncidentFromEvent(
    reason: string,
    payload: any,
    userId: string
  ) {
    const repoName = payload.repository?.full_name;
    const repoUrl = payload.repository?.html_url;

    console.log(`🚨 Triggering Incident for ${repoName} — ${reason}`);

    const integration = await prisma.userThirdpartyIntegration.findFirst({
      where: {
        provider: BusinessNotificationChannels.GITHUB,
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
      throw new NotFoundError("⚠ No Github Integration found for this user");
    }

    const businessId = integration.user.business?.id;

    if (!businessId) {
      console.warn("⚠ No business found for repo:", repoName);
      throw new NotFoundError("⚠ No business found for repo: " + repoName);
    }

    if (!integration.assignedToEmail) {
      throw new ConflictError(
        "Please configure a default email to assign github raised incidents as there have been a failed deployement"
      );
    }

    const request: IncidentRequest = {
      template: IncidentTemplate.NONE,
      reason: reason + `\n url: ${repoUrl}`,
      priority: Priority.MEDIUM,
      username: "github deployment",
      assignedTo: integration.assignedToEmail,
      createdFrom: "GITHUB",
    };

    await this.incidentService.submitIncident(request, userId, businessId);

    console.log(`✅ Incident created for ${repoName} (${businessId})`);
  }
}
