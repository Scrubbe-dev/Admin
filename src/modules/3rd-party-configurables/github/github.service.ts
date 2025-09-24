import { Octokit } from "@octokit/rest";
import axios from "axios";
import prisma from "../../../prisma-clients/client";
import { BusinessNotificationChannels } from "@prisma/client";
import { gitAppConfig, githubConfig } from "../../../config/github.config";
import { NotFoundError, UnauthorizedError } from "../../auth/error";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { GithubWebhookService } from "./github.webhook";
import { Request } from "express";
import { GithubRepoRequest } from "./github.schema";

export class GithubService {
  constructor(private githubWebhookService: GithubWebhookService) {}
  
  async getAuthUrl(userId: string) {
    const clientId = githubConfig.clientId;
    const redirectUrl = encodeURIComponent(githubConfig.redirectUrl); // FIX: Proper encoding
    const scopes = githubConfig.scopes;

      const { url } = gitAppConfig.getWebFlowAuthorizationUrl({
        state: "stated0c4e434-078c-45f6-998d-7376d2158bd6", // FIX: Use a proper state parameter for CSRF protection
      });


     console.log("Generating GitHub OAuth URL with:", {
       url,
       clientId,
       redirectUrl,
       scopes,
       userId,
       data: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUrl}&scope=${scopes}&state=${userId}`
     });
    return url
  }

  async handleOAuthCallback(code: string, userId: string) {
    try {
      const tokenResp = await axios.post(
        `https://github.com/login/oauth/access_token`,
        {
          client_id: githubConfig.clientId,
          client_secret: githubConfig.clientSecret,
          code,
        },
        { 
          headers: { 
            Accept: "application/json",
            "Content-Type": "application/json"
          } 
        }
      );

      if (tokenResp.data.error) {
        throw new Error(`GitHub OAuth error: ${tokenResp.data.error_description}`);
      }

      const accessToken = tokenResp.data.access_token;
      const refreshToken = tokenResp.data.refresh_token; // FIX: Use refresh_token if available

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

      return { status: "success", message: "GitHub connected successfully", savedIntegration };
    } catch (error) {
      console.error("OAuth callback error:", error);
      throw error;
    }
  }

  // ... rest of your service methods remain the same
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

  async saveMonitoredRepos(userId: string, request: GithubRepoRequest) {
    const integration = await prisma.userThirdpartyIntegration.findFirst({
      where: {
        userId,
        provider: BusinessNotificationChannels.GITHUB,
        assignedToEmail: request.assignTo,
      },
    });

    if (!integration?.accessToken) {
      throw new NotFoundError("GitHub connection not found for this user");
    }

    const octokit = new Octokit({ auth: integration.accessToken });

    for (const repo of request.repos) {
      await octokit.repos.createWebhook({
        owner: repo.owner,
        repo: repo.name,
        config: {
          url: `${githubConfig.webhookUrl}?userId=${userId}`,
          content_type: "json",
          secret: githubConfig.webhookSecret,
        },
        events: githubConfig.webhookEvents,
      });
    }

    await prisma.userThirdpartyIntegration.update({
      where: { id: integration.id },
      data: { metadata: { repos: request.repos } as unknown as InputJsonValue },
    });

    return { status: "success", message: "Repositories connected" };
  }

  async handleWebhook(
    payload: any,
    event: string,
    userId: string,
    req: Request
  ) {
    const isSignValid = this.githubWebhookService.verifySignature(req);

    if (!isSignValid) {
      throw new UnauthorizedError("Invalid signature");
    }

    if (!event) {
      throw new UnauthorizedError("Missing X-GitHub-Event header");
    }

    await this.githubWebhookService.handleEvent(event, payload, userId);
  }
}