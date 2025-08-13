import { NextFunction, Request, Response } from "express";
import { GithubService } from "./github.service";
import { validateRequest } from "../../auth/utils/validators";
import { githubSchema } from "./github.schema";
import { GithubRepoRequest } from "./github.types";

export class GithubController {
  constructor(private githubService: GithubService) {}

  async connectGithub(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.sub!;
    //   const { userId } = req.params;
      const response = await this.githubService.getAuthUrl(userId);

      res.redirect(response);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async listRepos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const repos = await this.githubService.listUserRepos(userId);

      res.json(repos);
    } catch (err) {
      next(err);
    }
  }

  async handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state: userId } = req.query;

      const result = await this.githubService.handleOAuthCallback(
        code as string,
        userId as string
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async saveMonitoredRepos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const repos = await validateRequest<GithubRepoRequest[]>(
        //@ts-ignore
        githubSchema,
        req.body
      );

      const result = await this.githubService.saveMonitoredRepos(userId, repos);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.header("X-Hub-Signature-256");
      const event = req.header("X-GitHub-Event");
      const payload = req.body;

      await this.githubService.handleWebhook(payload, signature!, event!);

      res.status(200).send("ok");
    } catch (error) {
      next(error);
    }
  }
}
