import axios from "axios";
import { BusinessNotificationChannels, Prisma } from "@prisma/client";
import prisma from "../../../prisma-clients/client";
import { NotFoundError, UnauthorizedError } from "../../auth/error";
import { gitlabConfig } from "../../../config/gitlab.config";
import { GitlabUtil } from "./gitlab.util";
import { GitlabMetadata } from "./gitlab.types";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { GitlabWebhookService } from "./gitlab.webhook";
import { Gitlab } from "@gitbeaker/node";
import { GitLabRepoRequest } from "./gitlab.schema";

export class GitlabService {
  private webhook = new GitlabWebhookService();
  private gitlabUtil = new GitlabUtil();

  getAuthUrl(userId: string) {
    const { clientId, redirectUrl, oauthAuthorizeUrl, scopes } = gitlabConfig;

    return `${oauthAuthorizeUrl}?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUrl
    )}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${userId}`;
  }

  async exchangeCodeForTokens(code: string, userId: string) {
    const { clientId, clientSecret, redirectUrl, oauthTokenUrl } = gitlabConfig;

    const tokenResp = await axios.post(
      oauthTokenUrl,
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUrl,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("=========== TOKEN RESP ===========", tokenResp.data);

    const { access_token, refresh_token, expires_in } = tokenResp.data;

    const encAccess = this.gitlabUtil.encryptSecret(access_token);
    const encRefresh = refresh_token
      ? this.gitlabUtil.encryptSecret(refresh_token)
      : null;

    let metadata: GitlabMetadata = {
      webhookSecret: gitlabConfig.webhookSecret,
    };

    const savedIntegration = await prisma.userThirdpartyIntegration.upsert({
      where: {
        userId_provider: {
          userId,
          provider: BusinessNotificationChannels.GITLAB,
        },
      },
      update: {
        accessToken: encAccess,
        refreshToken: encRefresh ?? undefined,
        metadata: metadata as unknown as InputJsonValue,
      },
      create: {
        userId,
        provider: BusinessNotificationChannels.GITLAB,
        accessToken: encAccess,
        refreshToken: encRefresh ?? undefined,
        metadata: metadata as unknown as InputJsonValue,
      },
    });

    console.log("========= SAVED INTEGRATION =========", savedIntegration);

    return {
      status: "success",
      message: "GitLab connected successfully",
    };
  }

  private async getClient(userId: string) {
    let token = await this.gitlabUtil.getFreshToken(userId);

    let api = new Gitlab({ oauthToken: token });

    try {
      // test with a lightweight call to verify token validity
      await api.Users.current();
    } catch (e: any) {
      if (e.response && e.response.status === 401) {
        // if token is invalid refresh and recall
        token = await this.refreshAndPersist(userId);
        api = new Gitlab({ oauthToken: token });
      } else {
        throw e;
      }
    }

    return api;
  }

  private async refreshAndPersist(userId: string): Promise<string> {
    const integ = await prisma.userThirdpartyIntegration.findFirst({
      where: { userId, provider: BusinessNotificationChannels.GITLAB },
    });

    if (!integ?.refreshToken) throw new NotFoundError("No refresh token");

    let refresh: string;
    try {
      refresh = this.gitlabUtil.decryptSecret(integ.refreshToken);
    } catch {
      refresh = integ.refreshToken;
    }

    const resp = await axios.post(
      gitlabConfig.oauthTokenUrl,
      {
        client_id: gitlabConfig.clientId,
        client_secret: gitlabConfig.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refresh,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const newAccess = resp.data.access_token as string;
    const encAccess = this.gitlabUtil.encryptSecret(newAccess);

    await prisma.userThirdpartyIntegration.update({
      where: { id: integ.id },
      data: { accessToken: encAccess },
    });

    return newAccess;
  }

  async listProjects(userId: string) {
    const api = await this.getClient(userId);

    const projects = await api.Projects.all({
      membership: true,
      simple: true,
      per_page: 100,
    });

    const mappedProjects = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      path_with_namespace: p.path_with_namespace,
      visibility: p.visibility,
    }));

    return mappedProjects;
  }

  async saveMonitoredProjects(userId: string, request: GitLabRepoRequest) {
    const integ = await prisma.userThirdpartyIntegration.findFirst({
      where: { userId, provider: BusinessNotificationChannels.GITLAB },
    });

    if (!integ) throw new NotFoundError("GitLab not connected");

    let meta: GitlabMetadata | null = null;
    try {
      meta = (integ.metadata as any) || null;
    } catch {
      meta = null;
    }
    if (!meta?.webhookSecret) {
      meta = {
        ...(meta || {}),
        webhookSecret: gitlabConfig.webhookSecret,
      };
    }

    const api = await this.getClient(userId);

    for (const p of request.repos) {
      const hookUrl = `${gitlabConfig.webhookUrl}?userId=${userId}`;

      await api.ProjectHooks.add(p.id, hookUrl, {
        token: meta.webhookSecret,
        push_events: true,
        merge_requests_events: true,
        pipeline_events: true,
        enable_ssl_verification: true,
      });
    }

    const updated = await prisma.userThirdpartyIntegration.update({
      where: { id: integ.id },
      data: {
        assignedToEmail: request.assignTo,
        metadata: {
          ...(meta as unknown as Object),
          projects: request.repos.map((p) => ({
            id: p.id,
            path_with_namespace: p.path_with_namespace,
          })),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    console.log("========= UPDATED =========", updated.metadata);

    return { status: "success", message: "Projects connected" };
  }

  async handleWebhook(xGitlabToken: string, userId: string, payload: any) {
    const integ = await prisma.userThirdpartyIntegration.findFirst({
      where: { userId, provider: BusinessNotificationChannels.GITLAB },
    });

    if (!integ) throw new NotFoundError("GitLab not connected");

    const metadata = integ.metadata as any as GitlabMetadata | null;

    console.log("========= SAVED METADATA =========", metadata);

    if (!metadata?.webhookSecret || xGitlabToken !== metadata.webhookSecret) {
      throw new UnauthorizedError("Invalid webhook token");
    }

    await this.webhook.handleEvent(payload, userId);
  }
}
