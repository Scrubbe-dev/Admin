import { NextFunction, Request, Response } from "express";
import { IncidentService } from "./incident.service";
import { validateRequest } from "../auth/utils/validators";
import {
  CommentRequest,
  CustomerFacingKbRequest,
  IncidentRequest,
  ResolveIncidentRequest,
  UpdateTicket,
} from "./incident.types";
import {
  commentSchema,
  customerFacingKbSchema,
  resolutionSchema,
  submitIncidentSchema,
  updateTicketSchema,
} from "./incident.schema";
import { IncidentUtils } from "./incident.util";

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


  
async generateTicketId(req: Request, res: Response, next: NextFunction) {
  try {
    let ticketId: string;
    let exists: boolean;
    
    // Generate unique ticket ID
    do {
      ticketId = IncidentUtils.generateTicketId();
      exists = await this.incidentService.checkTicketIdExists(ticketId);
    } while (exists);

    res.json({
      ticketId,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async submitIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.sub!;
    const businessId = req.user?.businessId!;
    
    // Use validation instead of direct casting
    const request = await validateRequest<IncidentRequest>(
      submitIncidentSchema,
      req.body
    );

    const response = await this.incidentService.submitIncident(
      request,
      userId,
      businessId
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

      const request = await validateRequest<ResolveIncidentRequest>(
        resolutionSchema,
        req.body
      );

      const respone = await this.incidentService.resolveIncident(
        incidentTicketId,
        request
      );

      res.json(respone);
    } catch (error) {
      next(error);
    }
  }

  async publishCustomerFacingKb(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { incidentTicketId } = req.params;

      const request = await validateRequest<CustomerFacingKbRequest>(
        customerFacingKbSchema,
        req.body
      );

      const respone = await this.incidentService.publishCustomerFacingKb(
        incidentTicketId,
        request
      );

      res.json(respone);
    } catch (error) {
      next(error);
    }
  }

  async getAiSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { incidentTicketId } = req.params;

      const respone = await this.incidentService.getAiSuggestion(
        incidentTicketId
      );

      res.json(respone);
    } catch (error) {
      next(error);
    }
  }

  async getFiveWhys(req: Request, res: Response, next: NextFunction) {
    try {
      const { incidentTicketId } = req.params;

      const respone = await this.incidentService.getFiveWhys(incidentTicketId);

      res.json(respone);
    } catch (error) {
      next(error);
    }
  }

  async getStakeHolderMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { incidentTicketId } = req.params;

      const respone = await this.incidentService.getStakeHolderMessage(
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
      // const request = await validateRequest<UpdateTicket>(
      //   updateTicketSchema,
      //   req.body
      // );

      const request = (await req.body) as UpdateTicket;
      const response = await this.incidentService.updateTicket(request);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // async addComment(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const userId = req.user?.sub!;
  //     const email = req.user?.email!;
  //     const businessId = req.user?.businessId!;

  //     const incidentTicketId = req.params.incidentTicketId;
  //     const request = await validateRequest<CommentRequest>(
  //       commentSchema,
  //       req.body
  //     );

  //     const response = await this.incidentService.addComment(
  //       request,
  //       userId,
  //       email,
  //       incidentTicketId,
  //       businessId
  //     );

  //     res.json(response);
  //   } catch (error) {
  //     next(error);
  //   }
  // }



  // In your controller's addComment method
async addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.sub!;
    const email = req.user?.email!;
    const businessId = req.user?.businessId!;

    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('Business ID:', businessId); // This might be undefined

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

  async getIncidentTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketId } = req.params;

      const response = await this.incidentService.getIncidentTicketById(
        ticketId
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async closeTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketId } = req.params;

      const response = await this.incidentService.closeTicket(ticketId);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

   // New method to get all incidents with pagination
  async getAllIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Optional filters
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        search: req.query.search as string,
      };

      const response = await this.incidentService.getAllIncidents(
        page, 
        limit, 
        filters
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

}
