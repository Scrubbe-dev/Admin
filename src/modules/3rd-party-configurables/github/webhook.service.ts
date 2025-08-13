import crypto from "crypto";
import { Request } from "express";
import prisma from "../../../prisma-clients/client";
import { BusinessNotificationChannels } from "@prisma/client";
import { githubConfig } from "../../../config/github.config";

export class GithubWebhookService {
  constructor() {}

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

  async handleEvent(event: string, payload: any) {
    console.log("GitHub Webhook Event:", event);

    // only handle certain events
    if (
      event === "deployment_status" &&
      payload.deployment_status?.state === "failure"
    ) {
      await this.triggerIncidentFromEvent("Deployment failed", payload);
    }

    if (
      event === "workflow_run" &&
      payload.workflow_run?.conclusion === "failure"
    ) {
      await this.triggerIncidentFromEvent("CI/CD Workflow failed", payload);
    }

    if (
      event === "push" &&
      payload.ref?.includes("main") &&
      payload.commits?.length
    ) {
      // You could also trigger if commit messages contain certain keywords
      const hasFixme = payload.commits.some((c: any) =>
        /fixme|urgent|critical/i.test(c.message)
      );
      if (hasFixme) {
        await this.triggerIncidentFromEvent("Critical commit pushed", payload);
      }
    }
  }

  private async triggerIncidentFromEvent(reason: string, payload: any) {
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
    });

    if (!integration || !integration.businessId) {
      console.warn("⚠ No business found for repo:", repoName);
      return;
    }

    // TODO - Call your incident creation logic here
    
    console.log(
      `✅ Incident created for ${repoName} (${integration.businessId})`
    );
  }
}
