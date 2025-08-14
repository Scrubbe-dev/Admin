import { NextFunction, Request, Response } from "express";
import { GitlabService } from "./gitlab.service";
import { validateRequest } from "../../auth/utils/validators";
import { GitLabRepoRequest, gitlabRepoSchema } from "./gitlab.schema";

export class GitlabController {
  constructor(private gitlabService: GitlabService) {}

  async connectGitlab(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      // const { userId } = req.params;

      const response = this.gitlabService.getAuthUrl(userId);

      res.json(response);
      // res.redirect(response);
    } catch (error) {
      next(error);
    }
  }

  async handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state: userId } = req.query;

      const response = await this.gitlabService.exchangeCodeForTokens(
        code as string,
        userId as string
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;

      const response = await this.gitlabService.listProjects(userId);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async saveMonitoredProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const request = await validateRequest<GitLabRepoRequest>(
        gitlabRepoSchema,
        req.body
      );

      const response = await this.gitlabService.saveMonitoredProjects(
        userId,
        request
      );

      res.json(response);
    } catch (e) {
      next(e);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.header("X-Gitlab-Token") || "";
      const userId = (req.query.userId as string) || "";

      await this.gitlabService.handleWebhook(token, userId, req.body);

      res.status(200).send("ok");
    } catch (e) {
      next(e);
    }
  }
}
