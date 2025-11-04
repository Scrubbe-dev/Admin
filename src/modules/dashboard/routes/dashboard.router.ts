import express from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { TokenService } from '../../auth/services/token.service';

const dashboardRouter = express.Router();
const dashboardController = new DashboardController();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);
const authMiddleware = new AuthMiddleware(tokenService);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard data and analytics
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardMetrics:
 *       type: object
 *       properties:
 *         openIncidents:
 *           type: integer
 *           example: 142
 *         mtta:
 *           type: integer
 *           description: Mean Time to Acknowledge in minutes
 *           example: 15
 *         mttr:
 *           type: integer
 *           description: Mean Time to Resolve in minutes
 *           example: 45
 *         slaCompliance:
 *           type: integer
 *           description: SLA Compliance percentage
 *           example: 95
 *     SystemHealth:
 *       type: object
 *       properties:
 *         component:
 *           type: string
 *           example: "API"
 *         status:
 *           type: string
 *           enum: [healthy, degraded, critical]
 *           example: "healthy"
 *         message:
 *           type: string
 *           example: "All systems operational"
 *     OnCallEngineer:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john.doe@example.com"
 *         shiftEnd:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T17:00:00.000Z"
 *     IncidentTrendData:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         opened:
 *           type: integer
 *           example: 12
 *         resolved:
 *           type: integer
 *           example: 8
 *     RecurringIssue:
 *       type: object
 *       properties:
 *         issue:
 *           type: string
 *           example: "DB Timeout"
 *         count:
 *           type: integer
 *           example: 25
 *         trend:
 *           type: string
 *           enum: [increasing, decreasing, stable]
 *           example: "increasing"
 *     TeamWorkload:
 *       type: object
 *       properties:
 *         teamMember:
 *           type: string
 *           example: "alex.garter@example.com"
 *         incidentCount:
 *           type: integer
 *           example: 15
 *         assignedIncidents:
 *           type: integer
 *           example: 8
 *     ActiveIncident:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "INC35227"
 *         title:
 *           type: string
 *           example: "API Downtime"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         assignedTo:
 *           type: string
 *           example: "Bob Carter"
 *         status:
 *           type: string
 *           example: "OPEN"
 *     SLABreach:
 *       type: object
 *       properties:
 *         incidentId:
 *           type: string
 *           example: "INC-003"
 *         title:
 *           type: string
 *           example: "Payment Issue"
 *         timeToBreach:
 *           type: integer
 *           description: Time to breach in minutes
 *           example: 30
 *         breachType:
 *           type: string
 *           enum: [ACK, RESOLVE]
 *           example: "RESOLVE"
 *     PostmortemSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "pm-001"
 *         title:
 *           type: string
 *           example: "API Outage Report"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T14:00:00.000Z"
 *         incidentId:
 *           type: string
 *           example: "INC35227"
 *     AutomationRun:
 *       type: object
 *       properties:
 *         workflow:
 *           type: string
 *           example: "Workflow A"
 *         status:
 *           type: string
 *           enum: [success, failure, running]
 *           example: "success"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T12:00:00.000Z"
 *     DashboardFilters:
 *       type: object
 *       properties:
 *         dateRange:
 *           type: object
 *           properties:
 *             start:
 *               type: string
 *               format: date-time
 *             end:
 *               type: string
 *               format: date-time
 *         team:
 *           type: string
 *         priority:
 *           type: array
 *           items:
 *             type: string
 *             enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         status:
 *           type: array
 *           items:
 *             type: string
 *             enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED, ON_HOLD]
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get complete dashboard data
 *     description: Retrieve all dashboard data including metrics, trends, SLA compliance, and system health
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: JSON string of dashboard filters
 *         example: '{"dateRange":{"start":"2024-01-01T00:00:00.000Z","end":"2024-01-15T23:59:59.999Z"},"priority":["HIGH","CRITICAL"]}'
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Dashboard data retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       $ref: '#/components/schemas/DashboardMetrics'
 *                     incidentTrends:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/IncidentTrendData'
 *                     recurringIssues:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RecurringIssue'
 *                     teamWorkload:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TeamWorkload'
 *                     slaBreaches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SLABreach'
 *                     systemHealth:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemHealth'
 *                     recentPostmortems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PostmortemSummary'
 *                     automationRuns:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AutomationRun'
 *                     activeIncidents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActiveIncident'
 *                     onCallEngineer:
 *                       $ref: '#/components/schemas/OnCallEngineer'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
dashboardRouter.get(
  '/',
  authMiddleware.authenticate,
  (req, res, next) => dashboardController.getDashboardData(req, res, next)
);

/**
 * @swagger
 * /api/v1/dashboard/metrics:
 *   get:
 *     summary: Get dashboard metrics and system health
 *     description: Retrieve key metrics, system health status, and on-call engineer information
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: JSON string of dashboard filters
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Dashboard metrics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       $ref: '#/components/schemas/DashboardMetrics'
 *                     systemHealth:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemHealth'
 *                     onCallEngineer:
 *                       $ref: '#/components/schemas/OnCallEngineer'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
dashboardRouter.get(
  '/metrics',
  authMiddleware.authenticate,
  (req, res, next) => dashboardController.getDashboardMetrics(req, res, next)
);

/**
 * @swagger
 * /api/v1/dashboard/analytics:
 *   get:
 *     summary: Get incident analytics and trends
 *     description: Retrieve incident trends, recurring issues, team workload, and active incidents
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: JSON string of dashboard filters
 *     responses:
 *       200:
 *         description: Incident analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Incident analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     incidentTrends:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/IncidentTrendData'
 *                     recurringIssues:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RecurringIssue'
 *                     teamWorkload:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TeamWorkload'
 *                     activeIncidents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActiveIncident'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
dashboardRouter.get(
  '/analytics',
  authMiddleware.authenticate,
  (req, res, next) => dashboardController.getIncidentAnalytics(req, res, next)
);

/**
 * @swagger
 * /api/v1/dashboard/sla:
 *   get:
 *     summary: Get SLA compliance and risk data
 *     description: Retrieve SLA compliance metrics, at-risk incidents, postmortems, and automation runs
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: JSON string of dashboard filters
 *     responses:
 *       200:
 *         description: SLA compliance data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "SLA compliance data retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     slaCompliance:
 *                       type: integer
 *                       example: 95
 *                     slaBreaches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SLABreach'
 *                     recentPostmortems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PostmortemSummary'
 *                     automationRuns:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AutomationRun'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
dashboardRouter.get(
  '/sla',
  authMiddleware.authenticate,
  (req, res, next) => dashboardController.getSLACompliance(req, res, next)
);

export default dashboardRouter;