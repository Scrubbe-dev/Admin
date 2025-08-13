import { Octokit } from "@octokit/rest";
import axios from "axios";
import crypto from "crypto";
import prisma from "../../../prisma-clients/client";
import { BusinessNotificationChannels } from "@prisma/client";
import { githubConfig } from "../../../config/github.config";
import { NotFoundError } from "../../auth/error";
import { GithubRepoRequest } from "./github.types";
import { InputJsonValue } from "@prisma/client/runtime/library";

export class GithubService {
  async getAuthUrl(userId: string) {
    const clientId = githubConfig.clientId;
    const redirectUrl = githubConfig.redirectUrl;
    const scopes = githubConfig.scopes;

    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUrl}&scope=${scopes}&state=${userId}`;
  }

  async handleOAuthCallback(code: string, userId: string) {
    const tokenResp = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: githubConfig.clientId,
        client_secret: githubConfig.clientSecret,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResp.data.access_token;
    const refreshToken = tokenResp.data.access_token;

    console.log("=========== TOKEN RESPONSE ===========", tokenResp.data);

    const savedIntegration = await prisma.userThirdpartyIntegration.upsert({
      where: {
        userId_provider: {
          userId,
          provider: BusinessNotificationChannels.GITHUB,
        },
      },
      update: { accessToken, refreshToken },
      create: {
        userId,
        provider: BusinessNotificationChannels.GITHUB,
        accessToken,
        refreshToken,
      },
    });

    console.log("=========== SAVED INTEGRATION ===========", savedIntegration);

    return { status: "success", message: "GitHub connected successfully" };
  }

  async listUserRepos(userId: string) {
    const integration = await prisma.userThirdpartyIntegration.findFirst({
      where: { userId, provider: BusinessNotificationChannels.GITHUB },
    });

    if (!integration?.accessToken) {
      throw new NotFoundError("GitHub not connected to this user");
    }

    const octokit = new Octokit({ auth: integration.accessToken });
    const repos = await octokit.repos.listForAuthenticatedUser({
      visibility: "all",
      per_page: 100,
    });

    const mappedRepos = repos.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      private: repo.private,
      owner: repo.owner.login,
    }));

    console.log("====== MAPPED REPOS =====", mappedRepos);

    return mappedRepos;
  }

  async saveMonitoredRepos(userId: string, repos: GithubRepoRequest[]) {
    const integration = await prisma.userThirdpartyIntegration.findFirst({
      where: { userId, provider: BusinessNotificationChannels.GITHUB },
    });

    if (!integration?.accessToken) {
      throw new NotFoundError("GitHub connection not found");
    }

    const octokit = new Octokit({ auth: integration.accessToken });

    for (const repo of repos) {
      await octokit.repos.createWebhook({
        owner: repo.owner,
        repo: repo.name,
        config: {
          url: githubConfig.webhookUrl,
          content_type: "json",
          secret: githubConfig.webhookSecret,
        },
        events: githubConfig.webhookEvents,
      });
    }

    await prisma.userThirdpartyIntegration.update({
      where: { id: integration.id },
      data: { metadata: { repos } as unknown as InputJsonValue },
    });

    return { status: "success", message: "Repositories connected" };
  }

  async handleWebhook(payload: any, signature: string, event: string) {
    // const expectedSignature =
    //   "sha256=" +
    //   crypto
    //     .createHmac("sha256", githubConfig.webhookSecret)
    //     .update(JSON.stringify(payload))
    //     .digest("hex");

    // if (signature !== expectedSignature) {
    //   throw new Error("Invalid signature");
    // }

    // // Use event to handle different cases
    // if (
    //   event === "deployment_status" &&
    //   payload.deployment_status?.state === "failure"
    // ) {
    //   console.log("Trigger incident:", payload);
    //   // incident creation logic...
    // }
  }
}
