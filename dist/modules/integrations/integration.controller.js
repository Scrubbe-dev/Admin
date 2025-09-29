"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationController = void 0;
const integration_service_1 = require("./integration.service");
class IntegrationController {
    /**
     * Get all available integrations
     * @param req - Express Request object
     * @param res - Express Response object
     * @returns Promise<void>
     */
    static async getAllIntegrations(req, res) {
        const { userId } = req.params;
        try {
            const integrations = await integration_service_1.IntegrationService.getSingleIntegrations(userId);
            const response = {
                success: true,
                data: integrations,
                message: 'Integrations retrieved successfully'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Controller: Error fetching integrations:', error);
            const errorResponse = {
                success: false,
                message: error instanceof Error ? error.message : 'Internal server error'
            };
            res.status(500).json(errorResponse);
        }
    }
}
exports.IntegrationController = IntegrationController;
