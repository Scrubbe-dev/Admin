"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EzraController = void 0;
const askezra_1 = require("./askezra");
const ezra_utils_1 = require("./ezra.utils");
const conversation_store_1 = require("./conversation-store");
class EzraController {
    ezraService;
    constructor(ezraService) {
        this.ezraService = ezraService;
    }
    async createRuleFromPrompt(req, res, next) {
        try {
            const { prompt } = req.body;
            const rule = await this.ezraService.createRuleFromPrompt(prompt);
            res.status(201).json(rule);
        }
        catch (error) {
            next(error);
        }
    }
    // sends as stream response
    async summarizeIncidents(req, res, next) {
        try {
            const { prompt } = req.body;
            const userId = req.user?.sub; // user id passed from auth middleware
            const ezraResponse = await (0, askezra_1.askEzra)("interpretPrompt", prompt);
            console.log("============ priority, timeframe, searchTerm, confirmSuggestion ============", ezraResponse.priority, ezraResponse.timeframe, ezraResponse.searchTerms, ezraResponse.wantsAction);
            const streamResponse = await this.ezraService.summarizeIncidents(ezraResponse, userId, prompt);
            return ezra_utils_1.EzraUtils.pipeStream(streamResponse, res);
        }
        catch (error) {
            next(error);
        }
    }
    async visualGraph(req, res, next) {
        try {
            const { prompt } = req.body;
            const userId = req.user?.sub;
            const ezraResponse = await (0, askezra_1.askEzra)("interpretPrompt", prompt);
            console.log("============ priority, timeframe, searchTerm, confirmSuggestion ============", ezraResponse.priority, ezraResponse.timeframe, ezraResponse.searchTerms, ezraResponse.wantsAction);
            const response = await this.ezraService.visualGraph(ezraResponse, prompt, userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async clearConversation(req, res, next) {
        try {
            const userId = req.user?.sub;
            (0, conversation_store_1.clearConversation)(userId);
        }
        catch (error) {
            console.error(`Failed to clear conversation history ${error}`);
            next(new Error(`Failed to clear conversation history ${error instanceof Error && error.message}`));
        }
    }
}
exports.EzraController = EzraController;
