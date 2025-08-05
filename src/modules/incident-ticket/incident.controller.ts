import { NextFunction, Request, Response } from "express";
import { IncidentService } from "./incident.service";
import { validateRequest } from "../auth/utils/validators";
import {
  CommentRequest,
  IncidentRequest,
  UpdateTicket,
} from "./incident.types";
import {
  commentSchema,
  submitIncidentSchema,
  updateTicketSchema,
} from "./incident.schema";

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

  async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const request = await validateRequest<UpdateTicket>(
        updateTicketSchema,
        req.body
      );

      const response = await this.incidentService.updateTicket(request, userId);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const email = req.user?.email!;
      const incidentTicketId = req.params.incidentTicketId;
      const request = await validateRequest<CommentRequest>(
        commentSchema,
        req.body
      );

      const response = await this.incidentService.addComment(
        request,
        userId,
        email,
        incidentTicketId
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const incidentTicketId = req.params.incidentTicketId;

      const response = await this.incidentService.getComments(incidentTicketId);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;

      const response = await this.incidentService.getTicketAnalytics(
        businessId
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
