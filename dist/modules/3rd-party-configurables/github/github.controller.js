"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubController = void 0;
const validators_1 = require("../../auth/utils/validators");
const github_schema_1 = require("./github.schema");
class GithubController {
    githubService;
    constructor(githubService) {
        this.githubService = githubService;
    }
    async connectGithub(req, res, next) {
        try {
            const userId = req.user?.sub;
            const authUrl = await this.githubService.getAuthUrl(userId);
            console.log("Redirecting to GitHub OAuth URL:", authUrl);
            // FIX: Properly redirect instead of returning JSON
            res.json({ url: authUrl });
        }
        catch (error) {
            next(error);
        }
    }
    async listRepos(req, res, next) {
        try {
            const userId = req.user?.sub;
            const repos = await this.githubService.listUserRepos(userId);
            res.json(repos);
        }
        catch (err) {
            next(err);
        }
    }
    async handleOAuthCallback(req, res, next) {
        try {
            const { code } = req.query;
            const userId = req.user?.sub;
            if (!code || !userId) {
                return res.status(400).json({
                    error: "Missing required parameters: code and state are required",
                });
            }
            const result = await this.githubService.handleOAuthCallback(code, userId);
            // FIX: Redirect to a success page or your frontend application
            res.json({ ...result, url: `${process.env.FRONTEND_URL}/integrations/github/success` });
        }
        catch (error) {
            // FIX: Redirect to an error page on failure
            console.error("OAuth callback error:", error);
            res.json({ url: `${process.env.FRONTEND_URL}/integrations/github/error` });
        }
    }
    async saveMonitoredRepos(req, res, next) {
        try {
            const userId = req.user?.sub;
            const repos = await (0, validators_1.validateRequest)(github_schema_1.githubRepoSchema, req.body);
            const result = await this.githubService.saveMonitoredRepos(userId, repos);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async handleWebhook(req, res, next) {
        try {
            const event = req.header("X-GitHub-Event");
            const payload = req.body;
            const userId = req.query.userId;
            await this.githubService.handleWebhook(payload, event, userId, req);
            res.status(200).send("ok");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GithubController = GithubController;
