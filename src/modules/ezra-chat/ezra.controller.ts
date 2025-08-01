import { NextFunction, Request, Response } from "express";
import { EzraService } from "./ezra.service";
import { askEzra } from "./askezra";
import { SummarizePromptResponse } from "./ezra.types";
import { EzraUtils } from "./ezra.utils";
import { clearConversation } from "./conversation-store";

export class EzraController {
  constructor(private ezraService: EzraService) {}

  async createRuleFromPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt } = req.body;
      const rule = await this.ezraService.createRuleFromPrompt(prompt);
      res.status(201).json(rule);
    } catch (error) {
      next(error);
    }
  }

  // sends as stream response
  async summarizeIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt } = req.body;
      const userId = req.user?.sub!; // user id passed from auth middleware

      const ezraResponse = await askEzra<SummarizePromptResponse>(
        "interpretPrompt",
        prompt
      );

      console.log(
        "============ priority, timeframe, searchTerm, confirmSuggestion ============",
        ezraResponse.priority,
        ezraResponse.timeframe,
        ezraResponse.searchTerms,
        ezraResponse.wantsAction,
      );

      const streamResponse = await this.ezraService.summarizeIncidents(
        ezraResponse,
        userId,
        prompt,
      );

      return EzraUtils.pipeStream(streamResponse, res);
    } catch (error) {
      next(error);
    }
  }

  async clearConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      clearConversation(userId);
    } catch (error) {
      console.error(`Failed to clear conversation history ${error}`);
      next(
        new Error(
          `Failed to clear conversation history ${
            error instanceof Error && error.message
          }`
        )
      );
    }
  }
}
