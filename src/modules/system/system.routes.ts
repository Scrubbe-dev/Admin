import { Router } from 'express';
import {
  rateLimiterMiddleware,
  securityHeadersMiddleware
} from './system.middleware';
import { getSystemInfoHandler } from './system.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/system-info:
 *   get:
 *     summary: Get comprehensive IP geolocation and system information
 *     description: |
 *       Retrieves detailed geolocation and system information including:
 *       - IP address and precise geolocation data
 *       - Connection details (ISP, ASN)
 *       - Country and regional information
 *       - Currency and timezone data
 *       - Device details from User-Agent
 *     tags:
 *       - System Information
 *     responses:
 *       200:
 *         description: Successful response with geolocation and system information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     ip:
 *                       type: string
 *                       format: ipv4
 *                       example: "169.150.197.246"
 *                     type:
 *                       type: string
 *                       enum: [ipv4, ipv6]
 *                       example: "ipv4"
 *                     city:
 *                       type: string
 *                       example: "Charleston"
 *                     region_name:
 *                       type: string
 *                       example: "South Carolina"
 *                     country_code:
 *                       type: string
 *                       example: "US"
 *                     country_name:
 *                       type: string
 *                       example: "United States of America"
 *                     continent_code:
 *                       type: string
 *                       example: "NA"
 *                     continent_name:
 *                       type: string
 *                       example: "North America"
 *                     is_eu:
 *                       type: boolean
 *                       example: false
 *                     latitude:
 *                       type: number
 *                       format: float
 *                       example: 32.778641
 *                     longitude:
 *                       type: number
 *                       format: float
 *                       example: -79.937721
 *                     connection:
 *                       type: object
 *                       properties:
 *                         asn:
 *                           type: integer
 *                           example: 2711
 *                         isp:
 *                           type: string
 *                           example: "Spirit Communications"
 *                     currencies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                             example: "USD"
 *                           name:
 *                             type: string
 *                             example: "United States dollar"
 *                           symbol:
 *                             type: string
 *                             example: "$"
 *                     timezones:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "UTC-05:00"
 *                     location:
 *                       type: object
 *                       properties:
 *                         calling_codes:
 *                           type: array
 *                           items:
 *                             type: string
 *                             example: "1"
 *                         capital:
 *                           type: string
 *                           example: "Washington, D.C."
 *                         flag:
 *                           type: string
 *                           format: uri
 *                           example: "http://assets.promptapi.com/flags/US.svg"
 *                         native_name:
 *                           type: string
 *                           example: "United States"
 *                         top_level_domains:
 *                           type: array
 *                           items:
 *                             type: string
 *                             example: ".us"
 *                     device:
 *                       type: object
 *                       properties:
 *                         os:
 *                           type: string
 *                           example: "Windows"
 *                         browser:
 *                           type: string
 *                           example: "Chrome"
 *                         deviceModel:
 *                           type: string
 *                           nullable: true
 *                           example: "iPhone"
 *                         deviceType:
 *                           type: string
 *                           nullable: true
 *                           example: "mobile"
 *                   example:
 *                     city: "Charleston"
 *                     connection:
 *                       asn: 2711
 *                       isp: "Spirit Communications"
 *                     continent_code: "NA"
 *                     continent_name: "North America"
 *                     country_code: "US"
 *                     country_name: "United States of America"
 *                     currencies:
 *                       - code: "USD"
 *                         name: "United States dollar"
 *                         symbol: "$"
 *                     ip: "169.150.197.246"
 *                     is_eu: false
 *                     latitude: 32.778641
 *                     location:
 *                       calling_codes: ["1"]
 *                       capital: "Washington, D.C."
 *                       flag: "http://assets.promptapi.com/flags/US.svg"
 *                       native_name: "United States"
 *                       top_level_domains: [".us"]
 *                     longitude: -79.937721
 *                     region_name: "South Carolina"
 *                     timezones: ["UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00", "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00", "UTC+10:00", "UTC+12:00"]
 *                     type: "ipv4"
 *                     device:
 *                       os: "Mac OS"
 *                       browser: "Chrome"
 *                       deviceModel: "MacBook Pro"
 *                       deviceType: "desktop"
 *       400:
 *         description: Bad request (invalid IP address)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve system information"
 */
router.get(
  '/system-info',
  securityHeadersMiddleware,
  // rateLimiterMiddleware,
  getSystemInfoHandler
);

export default router;