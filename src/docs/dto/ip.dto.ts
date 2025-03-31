// src/dtos/ip.dto.ts
/**
 * @swagger
 * components:
 *   schemas:
 *     IPConversionRequest:
 *       type: object
 *       required:
 *         - ip
 *         - targetVersion
 *       properties:
 *         ip:
 *           type: string
 *           example: "192.168.1.1"
 *           description: IP address to convert
 *         targetVersion:
 *           type: integer
 *           enum: [4, 6]
 *           example: 6
 *           description: Target IP version (4 for IPv4, 6 for IPv6)
 */
export interface IPConversionRequest {
    ip: string;
    targetVersion: 4 | 6;
  }