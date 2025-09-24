import { NextFunction, Request, Response } from "express";
import { GithubService } from "./github.service";
import { validateRequest } from "../../auth/utils/validators";
import { GithubRepoRequest, githubRepoSchema } from "./github.schema";

export class GithubController {
  constructor(private githubService: GithubService) {}

  async connectGithub(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;

      const authUrl = await this.githubService.getAuthUrl(userId);

      // FIX: Properly redirect instead of returning JSON
      res.redirect(authUrl);
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

      if (!code || !userId) {
        return res.status(400).json({
          error: "Missing required parameters: code and state are required",
        });
      }

      const result = await this.githubService.handleOAuthCallback(
        code as string,
        userId as string
      );

      // FIX: Redirect to a success page or your frontend application
      res.redirect(`${process.env.FRONTEND_URL}/integrations/github/success`);
    } catch (error) {
      // FIX: Redirect to an error page on failure
      console.error("OAuth callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/integrations/github/error`);
    }
  }

  async saveMonitoredRepos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const repos = await validateRequest<GithubRepoRequest>(
        githubRepoSchema,
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
      const event = req.header("X-GitHub-Event");
      const payload = req.body;
      const userId = req.query.userId as string;

      await this.githubService.handleWebhook(payload, event!, userId, req);

      res.status(200).send("ok");
    } catch (error) {
      next(error);
    }
  }
}