"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const integration_util_1 = require("./integration.util");
const prisma_1 = __importDefault(require("../../lib/prisma"));
class IntegrationService {
    /**
     * Retrieves all available integrations
     * @returns Promise<Integration[]> - Array of available integrations
     */
    static async getSingleIntegrations(userId) {
        try {
            // Map the enum values to the response format
            const integrations = await prisma_1.default?.userThirdpartyIntegration.findMany({
                where: { userId }
            });
            // Sort integrations alphabetically by name for consistent ordering
            // return integrations.sort((a, b) => a.name.localeCompare(b.name));
            const newIntegration = integrations.map((data) => {
                return {
                    ...data,
                    name: data.provider.toUpperCase()
                };
            });
            return newIntegration;
        }
        catch (error) {
            console.error('Error fetching integrations:', error);
            throw new Error('Failed to fetch integrations');
        }
    }
    /**
     * Retrieves all available integrations
     * @returns Promise<Integration[]> - Array of available integrations
     */
    static async getAllIntegrations() {
        try {
            // Map the enum values to the response format
            const integrations = (0, integration_util_1.mapIntegrationsToResponse)();
            // Sort integrations alphabetically by name for consistent ordering
            return integrations.sort((a, b) => a.name.localeCompare(b.name));
        }
        catch (error) {
            console.error('Error fetching integrations:', error);
            throw new Error('Failed to fetch integrations');
        }
    }
    /**
     * Validates if integration exists by name
     * @param name - Integration name to validate
     * @returns boolean - Whether integration exists
     */
    static async validateIntegrationExists(name) {
        try {
            const integrations = await this.getAllIntegrations();
            return integrations.some(integration => integration.name.toLowerCase() === name.toLowerCase());
        }
        catch (error) {
            console.error('Error validating integration:', error);
            return false;
        }
    }
}
exports.IntegrationService = IntegrationService;
