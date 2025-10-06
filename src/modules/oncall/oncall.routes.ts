import { Response, Request, Router, NextFunction } from 'express';
import { OnCallController } from './oncall.controller';

const router = Router();
const onCallController = new OnCallController();

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
 *         - startDate
 *         - endDate
 *         - teamMembers
 *       properties:
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date of the on-call assignment period
 *           example: "2024-01-15T00:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date of the on-call assignment period
 *           example: "2024-01-22T23:59:59.999Z"
 *         teamMembers:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OnCallTeamMember'
 *           description: Array of team members with their assigned time slots
 *     OnCallTeamMemberResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the team member assignment
 *           example: "660e8400-e29b-41d4-a716-446655440000"
 *         member:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "550e8400-e29b-41d4-a716-446655440000"
 *             email:
 *               type: string
 *               format: email
 *               example: "john.doe@example.com"
 *             firstName:
 *               type: string
 *               nullable: true
 *               example: "John"
 *             lastName:
 *               type: string
 *               nullable: true
 *               example: "Doe"
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "17:00"
 *     OnCallAssignmentResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the on-call assignment
 *           example: "770e8400-e29b-41d4-a716-446655440000"
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T00:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: "2024-01-22T23:59:59.999Z"
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, COMPLETED]
 *           example: "ACTIVE"
 *         teamMembers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OnCallTeamMemberResponse'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-10T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-10T10:30:00.000Z"
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
 *           example: ["startDate is required and must be a string"]
 *         error:
 *           type: string
 *           description: Detailed error message (only in development)
 *           example: "User already has overlapping on-call assignments"
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
 *     summary: Create a new on-call assignment
 *     description: Assign team members to on-call shifts for a specific date range with their respective time slots
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
 *                 startDate: "2024-01-15T00:00:00.000Z"
 *                 endDate: "2024-01-22T23:59:59.999Z"
 *                 teamMembers:
 *                   - member: "550e8400-e29b-41d4-a716-446655440000"
 *                     startTime: "09:00"
 *                     endTime: "17:00"
 *                   - member: "550e8400-e29b-41d4-a716-446655440001"
 *                     startTime: "17:00"
 *                     endTime: "09:00"
 *             multipleMembers:
 *               summary: Multiple team members assignment
 *               value:
 *                 startDate: "2024-02-01T00:00:00.000Z"
 *                 endDate: "2024-02-07T23:59:59.999Z"
 *                 teamMembers:
 *                   - member: "550e8400-e29b-41d4-a716-446655440002"
 *                     startTime: "08:00"
 *                     endTime: "16:00"
 *                   - member: "550e8400-e29b-41d4-a716-446655440003"
 *                     startTime: "16:00"
 *                     endTime: "00:00"
 *                   - member: "550e8400-e29b-41d4-a716-446655440004"
 *                     startTime: "00:00"
 *                     endTime: "08:00"
 *     responses:
 *       201:
 *         description: On-call assignment created successfully
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
 *                   example: "On-call assignment created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/OnCallAssignmentResponse'
 *       400:
 *         description: Bad request - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found - One or more users not found
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
 *         description: Conflict - Overlapping assignments detected
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
 *                   example: "User 550e8400-e29b-41d4-a716-446655440000 already has overlapping on-call assignments"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/assign-member', asyncHandler(onCallController.assignMember.bind(onCallController)));

/**
 * @swagger
 * /get-all-assign:
 *   get:
 *     summary: Get all on-call assignments
 *     description: Retrieve a list of all on-call assignments with their team members and schedule details
 *     tags:
 *       - On-Call
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, COMPLETED]
 *         description: Filter assignments by status
 *         example: "ACTIVE"
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
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
 *                     $ref: '#/components/schemas/OnCallAssignmentResponse'
 *             examples:
 *               multipleAssignments:
 *                 summary: Multiple assignments response
 *                 value:
 *                   success: true
 *                   message: "On-call assignments retrieved successfully"
 *                   data:
 *                     - id: "770e8400-e29b-41d4-a716-446655440000"
 *                       startDate: "2024-01-15T00:00:00.000Z"
 *                       endDate: "2024-01-22T23:59:59.999Z"
 *                       status: "ACTIVE"
 *                       teamMembers:
 *                         - id: "660e8400-e29b-41d4-a716-446655440000"
 *                           member:
 *                             id: "550e8400-e29b-41d4-a716-446655440000"
 *                             email: "john.doe@example.com"
 *                             firstName: "John"
 *                             lastName: "Doe"
 *                           startTime: "09:00"
 *                           endTime: "17:00"
 *                       createdAt: "2024-01-10T10:30:00.000Z"
 *                       updatedAt: "2024-01-10T10:30:00.000Z"
 *                     - id: "770e8400-e29b-41d4-a716-446655440001"
 *                       startDate: "2024-01-23T00:00:00.000Z"
 *                       endDate: "2024-01-30T23:59:59.999Z"
 *                       status: "ACTIVE"
 *                       teamMembers:
 *                         - id: "660e8400-e29b-41d4-a716-446655440001"
 *                           member:
 *                             id: "550e8400-e29b-41d4-a716-446655440001"
 *                             email: "jane.smith@example.com"
 *                             firstName: "Jane"
 *                             lastName: "Smith"
 *                           startTime: "17:00"
 *                           endTime: "09:00"
 *                       createdAt: "2024-01-17T14:20:00.000Z"
 *                       updatedAt: "2024-01-17T14:20:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get-all-assign', asyncHandler(onCallController.getAllAssignments.bind(onCallController)));

/**
 * @swagger
 * /get-assign/{id}:
 *   get:
 *     summary: Get a specific on-call assignment
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
 *             examples:
 *               singleAssignment:
 *                 summary: Single assignment response
 *                 value:
 *                   success: true
 *                   message: "On-call assignment retrieved successfully"
 *                   data:
 *                     id: "770e8400-e29b-41d4-a716-446655440000"
 *                     startDate: "2024-01-15T00:00:00.000Z"
 *                     endDate: "2024-01-22T23:59:59.999Z"
 *                     status: "ACTIVE"
 *                     teamMembers:
 *                       - id: "660e8400-e29b-41d4-a716-446655440000"
 *                         member:
 *                           id: "550e8400-e29b-41d4-a716-446655440000"
 *                           email: "john.doe@example.com"
 *                           firstName: "John"
 *                           lastName: "Doe"
 *                         startTime: "09:00"
 *                         endTime: "17:00"
 *                       - id: "660e8400-e29b-41d4-a716-446655440001"
 *                         member:
 *                           id: "550e8400-e29b-41d4-a716-446655440001"
 *                           email: "jane.smith@example.com"
 *                           firstName: "Jane"
 *                           lastName: "Smith"
 *                         startTime: "17:00"
 *                         endTime: "09:00"
 *                     createdAt: "2024-01-10T10:30:00.000Z"
 *                     updatedAt: "2024-01-10T10:30:00.000Z"
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
router.get('/get-assign/:id', asyncHandler(onCallController.getAssignmentById.bind(onCallController)));

export default router;