import { NextFunction, Request, Response } from "express";
import { IncidentService } from "./incident.service";
import { validateRequest } from "../auth/utils/validators";
import { IncidentRequest } from "./incident.types";
import { submitIncidentSchema } from "./incident.schema";

export class IncidentController {
  constructor(private incidentService = new IncidentService()) {}
  async getIncidentsByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const response = await this.incidentService.getIncidentTicketByUser(
        userId,
        page,
        limit
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const request = await validateRequest<IncidentRequest>(
        submitIncidentSchema,
        req.body
      );
      
      const response = await this.incidentService.submitIncident(
        request,
        userId
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
