import { DatavisualController } from "./data-visual.controller";
import prisma from "../../prisma-clients/client";
import express from "express";
import { TokenService } from "../auth/services/token.service";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";

const dataVisualRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);
const authMiddleware = new AuthMiddleware(tokenService);

const datavisualController = new DatavisualController();

/**
 * @swagger
 * tags:
 *   name: Data Visual
 *   description: Data visualization operations
 */


/**
 * @swagger
 * /api/v1/ezra/data-visual:
 *   get:
 *     summary: Retrieve data for visualization charts
 *     description: >
 *       This endpoint returns pre-aggregated data for visualization, including time-series metrics
 *       (e.g., multiple failed login attempts) and geolocation-based data (e.g., unusual login locations).
 *
 *       Data is returned as structured JSON containing chart data points and additional datasets
 *       for rendering in dashboards or analytic tools.
 *     tags: [Data Visual]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: JSON object containing visualization datasets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chartDataPoints:
 *                   type: array
 *                   description: Time-series data points for chart visualization
 *                   items:
 *                     type: object
 *                     properties:
 *                       x:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-24T09:10:00Z"
 *                       y:
 *                         type: number
 *                         example: 850
 *                 dataset1:
 *                   type: array
 *                   description: Geospatial data for unusual login attempts (longitude/latitude)
 *                   items:
 *                     type: object
 *                     properties:
 *                       x:
 *                         type: number
 *                         description: Longitude
 *                         example: -80.1601893198458
 *                       y:
 *                         type: number
 *                         description: Latitude
 *                         example: 5.923453200853627
 *                 dataset2:
 *                   type: array
 *                   description: Additional dataset for comparative visualization
 *                   items:
 *                     type: object
 *                     properties:
 *                       x:
 *                         type: number
 *                         description: Longitude
 *                         example: -77.9187804125967
 *                       y:
 *                         type: number
 *                         description: Latitude
 *                         example: 3.5661757738764277
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to retrieve visualization data
 */
dataVisualRouter.get("/", authMiddleware.authenticate, (req, res, next) => {
  datavisualController.getDataVisual(req, res, next);
});

export default dataVisualRouter;
