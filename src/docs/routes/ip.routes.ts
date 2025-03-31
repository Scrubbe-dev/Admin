// src/routes/ip.routes.ts

import { Router } from 'express';
import { IPController } from '../../docs/controller/ip.controller';


const router = Router();

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


router.get('/ip/:address', IPController.getIpInfo);
router.post('/ip/convert', IPController.convertIp);

export default router;