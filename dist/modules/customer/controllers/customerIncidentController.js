"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerIncidentController = void 0;
const customerIncidentService_1 = require("../services/customerIncidentService");
class CustomerIncidentController {
    static async createIncident(req, res) {
        try {
            const result = await customerIncidentService_1.CustomerIncidentService.createIncident(req.body, req.customer.id, req.customer.companyUserId);
            if (result.success) {
                res.status(201).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error creating incident',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
    static async getIncidents(req, res) {
        try {
            const result = await customerIncidentService_1.CustomerIncidentService.getCustomerIncidents(req.query, req.customer.id, req.customer.companyUserId);
            if (result.success) {
                res.status(200).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error retrieving incidents',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
    static async getIncident(req, res) {
        try {
            const { incidentId } = req.params;
            const result = await customerIncidentService_1.CustomerIncidentService.getIncidentById(incidentId, req.customer.id, req.customer.companyUserId);
            if (result.success) {
                res.status(200).json(result);
            }
            else {
                res.status(404).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error retrieving incident',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
    static async addComment(req, res) {
        try {
            const { incidentId } = req.params;
            const { content } = req.body;
            if (!content) {
                const response = {
                    success: false,
                    message: 'Comment content is required'
                };
                return res.status(400).json(response);
            }
            const result = await customerIncidentService_1.CustomerIncidentService.addComment(incidentId, req.customer.id, req.customer.companyUserId, content);
            if (result.success) {
                res.status(201).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error adding comment',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
}
exports.CustomerIncidentController = CustomerIncidentController;
