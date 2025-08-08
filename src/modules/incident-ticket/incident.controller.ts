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
import { getIO } from "../socket/init-socket";

// const io = getIO();

export class IncidentController {
  constructor(private incidentService = new IncidentService()) {}
  async getIncidentTicketByBusiness(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const businessId = req.user?.businessId!;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const response = await this.incidentService.getIncidentTicketByBusiness(
        businessId,
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
      const businessId = req.user?.businessId!;
      const request = await validateRequest<IncidentRequest>(
        submitIncidentSchema,
        req.body
      );

      const response = await this.incidentService.submitIncident(
        request,
        userId,
        businessId
        // io
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async acknowledgeIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const { incidentTicketId } = req.params;

      const respone = await this.incidentService.acknowledgeIncident(
        incidentTicketId
      );

      res.json(respone);
    } catch (error) {
      next(error);
    }
  }

  async resolveIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const { incidentTicketId } = req.params;

      const respone = await this.incidentService.resolveIncident(
        incidentTicketId
      );

      res.json(respone);
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

      const response = await this.incidentService.updateTicket(request);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      const email = req.user?.email!;
      const businessId = req.user?.businessId!;

      const incidentTicketId = req.params.incidentTicketId;
      const request = await validateRequest<CommentRequest>(
        commentSchema,
        req.body
      );

      const response = await this.incidentService.addComment(
        request,
        userId,
        email,
        incidentTicketId,
        businessId
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
      const businessId = req.user?.businessId!;

      const response = await this.incidentService.getTicketAnalytics(
        businessId
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { incidentTicketId } = req.params;

      const response = await this.incidentService.getMessages(incidentTicketId);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
