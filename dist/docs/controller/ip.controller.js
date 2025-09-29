"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIpInfo = exports.IPController = void 0;
const logger_1 = require("../../common/logger/logger");
const ip_utils_1 = require("../utils/ip.utils");
const ip_validator_1 = require("../validators/ip.validator");
/**
 * @swagger
 * tags:
 *   name: IP
 *   description: IP address information and conversion
 */
class IPController {
    /**
     * @swagger
     * /ip/{address}:
     *   get:
     *     summary: Get IP address information
     *     description: Retrieve geolocation and network information for an IP address
     *     tags: [IP]
     *     parameters:
     *       - in: path
     *         name: address
     *         required: true
     *         schema:
     *           type: string
     *           example: "192.168.1.1"
     *         description: IPv4 or IPv6 address
     *     responses:
     *       200:
     *         description: Successful operation
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/IPGeoResponse'
     *       400:
     *         description: Invalid IP address format
     *       404:
     *         description: IP information not found
     *       500:
     *         description: Server error
     */
    static async getIpInfo(req, res) {
        try {
            const { address } = req.params;
            // Validate IP address
            const validationError = (0, ip_validator_1.validateIP)(address);
            if (validationError) {
                logger_1.logger.warn(`Invalid IP address: ${address}`, { error: validationError });
                res.status(400).json({ error: validationError });
                return;
            }
            // Convert IP if needed (example implementation)
            const normalizedIp = ip_utils_1.IPConverter.normalizeIP(address, 4);
            if (!normalizedIp) {
                logger_1.logger.error(`IP normalization failed for address: ${address}`);
                res.status(400).json({ error: 'Invalid IP address format' });
                return;
            }
            // Here you would typically call your IP geolocation service
            const mockResponse = {
                ip: normalizedIp,
                type: isIPv4(normalizedIp) ? 'ipv4' : 'ipv6',
                city: 'Example City',
                country_code: 'US',
                // ... other fields
            };
            logger_1.logger.info(`IP info retrieved for ${address}`);
            res.status(200).json(mockResponse);
        }
        catch (error) {
            logger_1.logger.error('Failed to get IP info', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * @swagger
     * /ip/convert:
     *   post:
     *     summary: Convert IP address format
     *     description: Convert between IPv4 and IPv6 formats
     *     tags: [IP]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - ip
     *               - targetVersion
     *             properties:
     *               ip:
     *                 type: string
     *                 example: "192.168.1.1"
     *               targetVersion:
     *                 type: number
     *                 enum: [4, 6]
     *                 example: 6
     *     responses:
     *       200:
     *         description: Successful conversion
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 original:
     *                   type: string
     *                 converted:
     *                   type: string
     *       400:
     *         description: Invalid input
     *       500:
     *         description: Server error
     */
    static async convertIp(req, res) {
        try {
            const { ip, targetVersion } = req.body;
            if (!ip || !targetVersion) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const convertedIp = ip_utils_1.IPConverter.normalizeIP(ip, targetVersion);
            if (!convertedIp) {
                res.status(400).json({ error: 'Conversion failed' });
                return;
            }
            res.status(200).json({
                original: ip,
                converted: convertedIp
            });
        }
        catch (error) {
            logger_1.logger.error('IP conversion failed', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.IPController = IPController;
// Helper type predicates
function isIPv4(ip) {
    return ip_utils_1.IPConverter.isIPv4(ip);
}
// Export the commonly used function
exports.getIpInfo = IPController.getIpInfo;
