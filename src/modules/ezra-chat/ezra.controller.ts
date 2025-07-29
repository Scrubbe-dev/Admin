import { NextFunction, Request, Response } from "express";
import { EzraService } from "./ezra.service";
import { askEzra } from "./askezra";
import { SummarizeIncidentResponse } from "./ezra.types";

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
      const { priority, timeframe } = await askEzra<SummarizeIncidentResponse>(
        "interpretSummary",
        prompt
      );

      const streamResponse = await this.ezraService.summarizeIncidents(
        priority,
        timeframe,
        req.user?.sub!, // user id passed from auth middleware
        prompt
      );

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("X-Accel-Buffering", "no");

      const reader = streamResponse.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const result = await reader?.read();
        if (!result) break;
        const { value, done } = result;
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        res.write(chunk);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  }
}
