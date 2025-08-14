import prisma from "../../../prisma-clients/client";
import { BusinessNotificationChannels, Priority } from "@prisma/client";
import { IncidentService } from "../../incident-ticket/incident.service";
import {
  IncidentRequest,
  IncidentTemplate,
} from "../../incident-ticket/incident.types";
import { ConflictError, NotFoundError } from "../../auth/error";

export class GitlabWebhookService {
  private incident = new IncidentService();

  async handleEvent(payload: any, userId: string) {
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

  private async triggerIncidentFromEvent(
    reason: string,
    payload: any,
    userId: string
  ) {
    const projectId = payload.project?.id;
    const projectPath = payload.project?.path_with_namespace;
    const repoUrl = payload.project?.web_url;

    const integration = await prisma.userThirdpartyIntegration.findFirst({
      where: {
        provider: BusinessNotificationChannels.GITLAB,
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

      throw new NotFoundError(
        "No business found for GitLab project: " + projectPath
      );
    }

    const businessId = integration.user.business.id;

    if (!integration.assignedToEmail) {
      throw new ConflictError(
        "Please configure a default email to assign gitlab raised incidents as there have been a failed deployement"
      );
    }

    const request: IncidentRequest = {
      template: IncidentTemplate.NONE,
      reason: `${reason}\nurl: ${repoUrl}`,
      priority: Priority.MEDIUM,
      username: "gitlab webflow",
      assignedTo: integration.assignedToEmail,
      createdFrom: "GITLAB",
    };

    await this.incident.submitIncident(request, userId, businessId);

    console.log(`✅ Incident created for ${projectPath} (${businessId})`);
  }
}
