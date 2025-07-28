import { NextFunction, Request, Response } from "express";
import { EzraService } from "./ezra.service";
import { askEzra } from "./askezra";

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

  async summarizeIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt } = req.body;
      const { priority, timeframe } = await askEzra(
        "interpretSummary",
        prompt,
        null
      );

      console.log(
        "======================= Filters and timeframe extracted: =======================",
        priority,
        timeframe
      );

      const response = await this.ezraService.summarizeIncidents(
        priority,
        timeframe,
        req.user?.sub!, // user id passed from auth middleware
        prompt
      );

      console.log(
        "======================= summarize incident service response =======================",
        response
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
