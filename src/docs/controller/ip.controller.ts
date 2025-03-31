// src/system/ip.controller.ts
import { Request, Response } from 'express';
import { IPGeoResponse } from '../types/ip.types';
import { logger } from '../../common/logger/logger';
import { IPConverter } from '../utils/ip.utils';
import { validateIP } from '../validators/ip.validator';

/**
 * @swagger
 * tags:
 *   name: IP
 *   description: IP address information and conversion
 */
export class IPController {
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
  static async getIpInfo(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      // Validate IP address
      const validationError = validateIP(address as any);
      if (validationError) {
        logger.warn(`Invalid IP address: ${address}`, { error: validationError });
        res.status(400).json({ error: validationError });
        return;
      }

      // Convert IP if needed (example implementation)
      const normalizedIp = IPConverter.normalizeIP(address, 4);
      if (!normalizedIp) {
        logger.error(`IP normalization failed for address: ${address}`);
        res.status(400).json({ error: 'Invalid IP address format' });
        return;
      }

      // Here you would typically call your IP geolocation service
      const mockResponse: IPGeoResponse = {
        ip: normalizedIp,
        type: isIPv4(normalizedIp) ? 'ipv4' : 'ipv6',
        city: 'Example City',
        country_code: 'US',
        // ... other fields
      };

      logger.info(`IP info retrieved for ${address}`);
      res.status(200).json(mockResponse);

    } catch (error) {
      logger.error('Failed to get IP info', { error });
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
  static async convertIp(req: Request, res: Response): Promise<void> {
    try {
      const { ip, targetVersion } = req.body;

      if (!ip || !targetVersion) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const convertedIp = IPConverter.normalizeIP(ip, targetVersion as 4 | 6);
      if (!convertedIp) {
        res.status(400).json({ error: 'Conversion failed' });
        return;
      }

      res.status(200).json({
        original: ip,
        converted: convertedIp
      });

    } catch (error) {
      logger.error('IP conversion failed', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Helper type predicates
function isIPv4(ip: string): boolean {
  return IPConverter.isIPv4(ip);
}

// Export the commonly used function
export const getIpInfo = IPController.getIpInfo;