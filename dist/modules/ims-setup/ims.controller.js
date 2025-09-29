"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMSController = void 0;
const ims_service_1 = require("./ims.service");
const token_service_1 = require("../auth/services/token.service");
const error_1 = require("../auth/error");
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15);
class IMSController {
    /**
     * Setup IMS endpoint
     */
    static async setupIMS(req, res) {
        try {
            // const userId = (req as any).user?.id; // Assuming user is authenticated and user ID is available
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                throw new error_1.UnauthorizedError("Authentication required");
            }
            const token = authHeader.split(" ")[1];
            const payload = await tokenService.verifyAccessToken(token);
            const userId = payload.sub;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const requestData = req.body;
            // Validate request
            const validation = ims_service_1.IMSService.validateIMSSetupRequest(requestData);
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request data',
                    errors: validation.errors
                });
                return;
            }
            // Process IMS setup
            const result = await ims_service_1.IMSService.setupIMS(userId, requestData);
            res.status(201).json(result);
        }
        catch (error) {
            console.error('IMS Controller Error:', error);
            if (error.message.includes('already has a business')) {
                res.status(409).json({
                    success: false,
                    message: error.message
                });
            }
            else if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error during IMS setup',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
                });
            }
        }
    }
    /**
     * Health check endpoint for IMS setup
     */
    static async healthCheck(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'IMS setup endpoint is healthy',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Health check failed',
                error: error.message
            });
        }
    }
}
exports.IMSController = IMSController;
