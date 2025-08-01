import { NextFunction, Request, Response } from "express";
import { dataVisualizationChart } from "./chart";

export class DatavisualController {
  constructor() {}
  async getDataVisual(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(dataVisualizationChart);
    } catch (error) {
      next(error);
    }
  }
}
