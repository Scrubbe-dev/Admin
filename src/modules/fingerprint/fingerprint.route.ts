import express from "express";
import { FingerprintService } from "./fingerprint.service";
import { FingerprintController } from "./fingerprint.controller";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { prisma } from "../../config/database";
import { TokenService } from "../auth/services/token.service";

const fingerprintRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const fingerprintService = new FingerprintService();
const fingerprintController = new FingerprintController(fingerprintService);
const authMiddleware = new AuthMiddleware(tokenService);

/**
 * @swagger
 * tags:
 *   name: Fingerprint
 *   description: APIs for managing fingerprint projects
 */

/**
 * @swagger
 * /api/v1/fingerprint/configuration:
 *   post:
 *     summary: Create or update fingerprint project configuration
 *     description: >
 *       Creates a new fingerprint project configuration for the authenticated user if none exists for the `FINGERPRINT` package,
 *       otherwise updates the existing configuration with the provided details. This ensures each user has a single configuration
 *       per package type.
 *
 *     tags: [Fingerprint]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - enviroment
 *               - package
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Fingerprint Project Alpha"
 *                 description: The display name of the fingerprint configuration
 *               enviroment:
 *                 type: string
 *                 example: "production"
 *                 description: The environment in which the fingerprint configuration will be used
 *               domain:
 *                 type: string
 *                 example: "example.com"
 *                 description: Optional domain associated with this configuration (must be a valid hostname)
 *               description:
 *                 type: string
 *                 example: "Configuration for fingerprint package in production"
 *                 description: Optional descriptive text about the configuration
 *               package:
 *                 type: string
 *                 enum: [FINGERPRINT]
 *                 example: "FINGERPRINT"
 *                 description: The package type (for this endpoint, always FINGERPRINT)
 *     responses:
 *       200:
 *         description: Configuration successfully created or updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "8d2b4c4e-39a4-4b47-8a1a-4df6f7c1a4a2"
 *                   description: Unique identifier for the configuration
 *                 name:
 *                   type: string
 *                   example: "Fingerprint Project Alpha"
 *                 enviroment:
 *                   type: string
 *                   example: "production"
 *                 domain:
 *                   type: string
 *                   nullable: true
 *                   example: "example.com"
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   example: "Configuration for fingerprint package in production"
 *                 modules:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["device fingerprint", "location tracker"]
 *                 package:
 *                   type: string
 *                   enum: [FINGERPRINT]
 *                   example: "FINGERPRINT"
 *                 lastseen:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-29T12:34:56.000Z"
 *       400:
 *         description: Bad request (invalid input data)
 *       401:
 *         description: Unauthorized (user not authenticated)
 *       500:
 *         description: Internal server error
 */
fingerprintRouter.post(
  "/configuration",
  authMiddleware.authenticate,
  (req, res, next) => {
    fingerprintController.fingerprintConfiguration(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/fingerprint/configuration:
 *   get:
 *     summary: Fetch user's fingerprint project configuration
 *     description: >
 *       Fetches fingerprint project configuration for the authenticated user.
 *       Throws an error if none exists for the `FINGERPRINT` package.
 *     tags: [Fingerprint]
 *     responses:
 *       200:
 *         description: Configuration successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "8d2b4c4e-39a4-4b47-8a1a-4df6f7c1a4a2"
 *                   description: Unique identifier for the configuration
 *                 name:
 *                   type: string
 *                   example: "Fingerprint Project Alpha"
 *                 enviroment:
 *                   type: string
 *                   example: "production"
 *                 domain:
 *                   type: string
 *                   nullable: true
 *                   example: "example.com"
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   example: "Configuration for fingerprint package in production"
 *                 modules:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["device fingerprint", "location tracker"]
 *                 package:
 *                   type: string
 *                   enum: [FINGERPRINT]
 *                   example: "FINGERPRINT"
 *                 lastseen:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-29T12:34:56.000Z"
 *       404:
 *         description: No configured fingerprint found for this user (Not found)
 *       401:
 *         description: Unauthorized (user not authenticated)
 *       500:
 *         description: Internal server error
 */
fingerprintRouter.get(
  "/configuration",
  authMiddleware.authenticate,
  (req, res, next) => {
    fingerprintController.getUserFingerprintConfig(req, res, next);
  }
);

export default fingerprintRouter;
