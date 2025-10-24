"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentController = void 0;
const incident_service_1 = require("./incident.service");
const validators_1 = require("../auth/utils/validators");
const incident_schema_1 = require("./incident.schema");
class IncidentController {
    incidentService;
    constructor(incidentService = new incident_service_1.IncidentService()) {
        this.incidentService = incidentService;
    }
    async getIncidentTicketByBusiness(req, res, next) {
        try {
            const businessId = req.user?.businessId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const response = await this.incidentService.getIncidentTicketByBusiness(businessId, page, limit);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async submitIncident(req, res, next) {
        try {
            const userId = req.user?.sub;
            const businessId = req.user?.businessId;
            // const request = await validateRequest<IncidentRequest>(
            //   submitIncidentSchema,
            //   req.body
            // );
            const request = (await req.body);
            const response = await this.incidentService.submitIncident(request, userId, businessId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async acknowledgeIncident(req, res, next) {
        try {
            const { incidentTicketId } = req.params;
            const respone = await this.incidentService.acknowledgeIncident(incidentTicketId);
            res.json(respone);
        }
        catch (error) {
            next(error);
        }
    }
    async resolveIncident(req, res, next) {
        try {
            const { incidentTicketId } = req.params;
            const request = await (0, validators_1.validateRequest)(incident_schema_1.resolutionSchema, req.body);
            const respone = await this.incidentService.resolveIncident(incidentTicketId, request);
            res.json(respone);
        }
        catch (error) {
            next(error);
        }
    }
    async publishCustomerFacingKb(req, res, next) {
        try {
            const { incidentTicketId } = req.params;
            const request = await (0, validators_1.validateRequest)(incident_schema_1.customerFacingKbSchema, req.body);
            const respone = await this.incidentService.publishCustomerFacingKb(incidentTicketId, request);
            res.json(respone);
        }
        catch (error) {
            next(error);
        }
    }
    async getAiSuggestion(req, res, next) {
        try {
            const { incidentTicketId } = req.params;
            const respone = await this.incidentService.getAiSuggestion(incidentTicketId);
            res.json(respone);
        }
        catch (error) {
            next(error);
        }
    }
    async getFiveWhys(req, res, next) {
        try {
            const { incidentTicketId } = req.params;
            const respone = await this.incidentService.getFiveWhys(incidentTicketId);
            res.json(respone);
        }
        catch (error) {
            next(error);
        }
    }
    async getStakeHolderMessage(req, res, next) {
        try {
            const { incidentTicketId } = req.params;
            const respone = await this.incidentService.getStakeHolderMessage(incidentTicketId);
            res.json(respone);
        }
        catch (error) {
            next(error);
        }
    }
    async updateTicket(req, res, next) {
        try {
            const userId = req.user?.sub;
            // const request = await validateRequest<UpdateTicket>(
            //   updateTicketSchema,
            //   req.body
            // );
            const request = (await req.body);
            const response = await this.incidentService.updateTicket(request);
            res.json(response);
        }
        catch (error) {
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
    async addComment(req, res, next) {
        try {
            const userId = req.user?.sub;
            const email = req.user?.email;
            const businessId = req.user?.businessId;
            console.log('User ID:', userId);
            console.log('Email:', email);
            console.log('Business ID:', businessId); // This might be undefined
            const incidentTicketId = req.params.incidentTicketId;
            const request = await (0, validators_1.validateRequest)(incident_schema_1.commentSchema, req.body);
            const response = await this.incidentService.addComment(request, userId, email, incidentTicketId, businessId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getComments(req, res, next) {
        try {
            const incidentTicketId = req.params.incidentTicketId;
            const response = await this.incidentService.getComments(incidentTicketId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getAnalytics(req, res, next) {
        try {
            const businessId = req.user?.businessId;
            const response = await this.incidentService.getTicketAnalytics(businessId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getMessages(req, res, next) {
        try {
            const { incidentTicketId } = req.params;
            const response = await this.incidentService.getMessages(incidentTicketId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getIncidentTicketById(req, res, next) {
        try {
            const { ticketId } = req.params;
            const response = await this.incidentService.getIncidentTicketById(ticketId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async closeTicket(req, res, next) {
        try {
            const { ticketId } = req.params;
            const response = await this.incidentService.closeTicket(ticketId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.IncidentController = IncidentController;
