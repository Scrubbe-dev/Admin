"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitlabController = void 0;
const validators_1 = require("../../auth/utils/validators");
const gitlab_schema_1 = require("./gitlab.schema");
class GitlabController {
    gitlabService;
    constructor(gitlabService) {
        this.gitlabService = gitlabService;
    }
    async connectGitlab(req, res, next) {
        try {
            const userId = req.user?.sub;
            const response = this.gitlabService.getAuthUrl(userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async handleOAuthCallback(req, res, next) {
        try {
            const { code, state: userId } = req.query;
            const response = await this.gitlabService.exchangeCodeForTokens(code, userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async listProjects(req, res, next) {
        try {
            const userId = req.user?.sub;
            const response = await this.gitlabService.listProjects(userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async saveMonitoredProjects(req, res, next) {
        try {
            const userId = req.user?.sub;
            const request = await (0, validators_1.validateRequest)(gitlab_schema_1.gitlabRepoSchema, req.body);
            const response = await this.gitlabService.saveMonitoredProjects(userId, request);
            res.json(response);
        }
        catch (e) {
            next(e);
        }
    }
    async handleWebhook(req, res, next) {
        try {
            const token = req.header("X-Gitlab-Token") || "";
            const userId = req.query.userId || "";
            await this.gitlabService.handleWebhook(token, userId, req.body);
            res.status(200).send("ok");
        }
        catch (e) {
            next(e);
        }
    }
}
exports.GitlabController = GitlabController;
