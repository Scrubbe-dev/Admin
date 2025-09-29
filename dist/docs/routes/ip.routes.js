"use strict";
// src/routes/ip.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ip_controller_1 = require("../../docs/controller/ip.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /ip/{address}:
 *   get:
 *     summary: Get IP address information
 *     description: Retrieve geolocation and network information for an IP address
 *     tags: [IP]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: IPv4 or IPv6 address
 *       - in: query
 *         name: detailed
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return detailed information
 *     responses:
 *       200:
 *         description: IP information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IPGeoResponse'
 *       400:
 *         description: Invalid IP address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/ip/:address', ip_controller_1.IPController.getIpInfo);
router.post('/ip/convert', ip_controller_1.IPController.convertIp);
exports.default = router;
