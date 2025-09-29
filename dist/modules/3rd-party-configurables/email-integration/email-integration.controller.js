"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailIntegrationController = void 0;
const validators_1 = require("../../auth/utils/validators");
const email_integration_schema_1 = require("./email-integration.schema");
class EmailIntegrationController {
    service;
    constructor(service) {
        this.service = service;
    }
    async connectEmailIntegration(req, res, next) {
        try {
            const userId = req.user?.sub;
            const request = await (0, validators_1.validateRequest)(email_integration_schema_1.emailIntegrationSchema, req.body);
            const result = await this.service.connectEmailIntegration(userId, request);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getEmailIntegration(req, res, next) {
        try {
            const userId = req.user?.sub;
            const result = await this.service.getEmailIntegration(userId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async handleInboundEmail(req, res, next) {
        try {
            const result = await this.service.handleInboundEmail(req.body);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EmailIntegrationController = EmailIntegrationController;
