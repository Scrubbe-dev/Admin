import { Response, Request, Router, NextFunction } from 'express';
import { OnCallController } from './oncall.controller';
import { TokenService } from '../auth/services/token.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';

const oncallRouter = Router();
const onCallController = new OnCallController();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);
const authMiddleware = new AuthMiddleware(tokenService);


// Utility to wrap async route handlers and forward errors to Express
function asyncHandler(fn: Function) {
	return function (this: unknown, req: Request, res: Response, next: NextFunction) {
		Promise.resolve(fn.call(this, req, res, next)).catch(next);
	};
}

/**
 * @swagger
 * components:
 *   schemas:
 *     OnCallTeamMember:
 *       type: object
 *       required:
 *         - member
 *         - startTime
 *         - endTime
 *       properties:
 *         member:
 *           type: string
 *           format: uuid
 *           description: User ID of the team member
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         startTime:
 *           type: string
 *           format: time
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Start time in HH:mm format (24-hour)
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           format: time
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: End time in HH:mm format (24-hour)
 *           example: "17:00"
 *     CreateOnCallAssignmentRequest:
 *       type: object
 *       required:
 *         - date
 *         - teamMembers
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the on-call assignment (YYYY-MM-DD)
 *           example: "2024-01-15"
 *         teamMembers:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OnCallTeamMember'
 *           description: Array of team members with their assigned time slots
 *     OnCallAssignmentResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the on-call assignment
 *           example: "770e8400-e29b-41d4-a716-446655440000"
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, COMPLETED]
 *           example: "ACTIVE"
 *         teamMembers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 example: "660e8400-e29b-41d4-a716-446655440000"
 *               member:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: "550e8400-e29b-41d4-a716-446655440000"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "john.doe@example.com"
 *                   firstName:
 *                     type: string
 *                     nullable: true
 *                     example: "John"
 *                   lastName:
 *                     type: string
 *                     nullable: true
 *                     example: "Doe"
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-10T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-10T10:30:00.000Z"
 *     GetAllAssignmentsResponse:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         teamMembers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               member:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation failed"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["date is required and must be a string"]
 *         error:
 *           type: string
 *           description: Detailed error message (only in development)
 *           example: "User already has an on-call assignment for this date"
 *   parameters:
 *     OnCallAssignmentId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: On-call assignment ID
 *       example: "770e8400-e29b-41d4-a716-446655440000"
 */

/**
 * @swagger
 * /assign-member:
 *   post:
 *     summary: Create a new on-call assignment for a specific date
 *     description: Assign team members to on-call shifts for a specific date with their respective time slots. All assigned members will receive email notifications.
 *     tags:
 *       - On-Call
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOnCallAssignmentRequest'
 *           examples:
 *             basicAssignment:
 *               summary: Basic on-call assignment
 *               value:
 *                 date: "2024-01-15"
 *                 teamMembers:
 *                   - member: "550e8400-e29b-41d4-a716-446655440000"
 *                     startTime: "09:00"
 *                     endTime: "17:00"
 *                   - member: "550e8400-e29b-41d4-a716-446655440001"
 *                     startTime: "17:00"
 *                     endTime: "09:00"
 *     responses:
 *       201:
 *         description: On-call assignment created successfully and notifications sent
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
 *                   example: "On-call assignment created successfully and notifications sent"
 *                 data:
 *                   $ref: '#/components/schemas/OnCallAssignmentResponse'
 *       400:
 *         description: Bad request - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found - One or more users not found or users without email addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User with id 550e8400-e29b-41d4-a716-446655440000 not found"
 *       409:
 *         description: Conflict - User already assigned for this date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User 550e8400-e29b-41d4-a716-446655440000 already has an on-call assignment for this date"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
oncallRouter.post('/assign-member', asyncHandler(onCallController.assignMember.bind(onCallController)));

/**
 * @swagger
 * /get-all-assign:
 *   get:
 *     summary: Get all on-call assignments
 *     description: Retrieve a list of all on-call assignments with their team members organized by date
 *     tags:
 *       - On-Call
 *     parameters:
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter assignments by specific date
 *         example: "2024-01-15"
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, COMPLETED]
 *         description: Filter assignments by status
 *         example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Successfully retrieved on-call assignments
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
 *                   example: "On-call assignments retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GetAllAssignmentsResponse'
 *             examples:
 *               multipleAssignments:
 *                 summary: Multiple assignments response
 *                 value:
 *                   success: true
 *                   message: "On-call assignments retrieved successfully"
 *                   data:
 *                     - date: "2024-01-15"
 *                       teamMembers:
 *                         - member: "550e8400-e29b-41d4-a716-446655440000"
 *                           startTime: "09:00"
 *                           endTime: "17:00"
 *                         - member: "550e8400-e29b-41d4-a716-446655440001"
 *                           startTime: "17:00"
 *                           endTime: "09:00"
 *                     - date: "2024-01-16"
 *                       teamMembers:
 *                         - member: "550e8400-e29b-41d4-a716-446655440002"
 *                           startTime: "08:00"
 *                           endTime: "16:00"
 *                     - date: "2024-01-17"
 *                       teamMembers:
 *                         - member: "550e8400-e29b-41d4-a716-446655440003"
 *                           startTime: "16:00"
 *                           endTime: "00:00"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
oncallRouter.get('/get-all-assign',
	authMiddleware.authenticate, 
	asyncHandler(onCallController.getAllAssignments.bind(onCallController)));

/**
 * @swagger
 * /get-assign/{id}:
 *   get:
 *     summary: Get a specific on-call assignment by ID
 *     description: Retrieve detailed information about a specific on-call assignment by its ID
 *     tags:
 *       - On-Call
 *     parameters:
 *       - $ref: '#/components/parameters/OnCallAssignmentId'
 *     responses:
 *       200:
 *         description: Successfully retrieved on-call assignment
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
 *                   example: "On-call assignment retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/OnCallAssignmentResponse'
 *       404:
 *         description: On-call assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "On-call assignment not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
oncallRouter.get('/get-assign/:id', asyncHandler(onCallController.getAssignmentById.bind(onCallController)));

export default oncallRouter;