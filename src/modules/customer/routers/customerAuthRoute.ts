// customerAuthRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import { CustomerAuthController } from "../controllers/customerAuthController";
import { authenticateCustomer } from "../middleware/customerMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cust_12345"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         contactEmail:
 *           type: string
 *           format: email
 *           example: "customer@example.com"
 *         companyUserId:
 *           type: string
 *           example: "user_67890"
 *         isActive:
 *           type: boolean
 *           example: true
 *         isVerified:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-04T15:30:45Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-04T15:30:45Z"
 *     Company:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "user_67890"
 *         name:
 *           type: string
 *           example: "John Smith"
 *         business:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Acme Corporation"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login successful"
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             customer:
 *               $ref: '#/components/schemas/Customer'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Invalid credentials"
 *         error:
 *           type: string
 *           example: "AUTH_ERROR"
 */

/**
 * @swagger
 * /api/v1/customer/companies:
 *   get:
 *     summary: Get available companies
 *     description: Retrieve a list of all available companies that a customer can register with
 *     tags:
 *       - Customer Authentication
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Successfully retrieved companies list
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
 *                   example: "Companies retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/companies",
  // (req: Request, res: Response, next: NextFunction) => {
  //   authenticateCustomer(req, res, next);
  // },
  CustomerAuthController.getCompanies
);

/**
 * @swagger
 * /api/v1/customer/register:
 *   post:
 *     summary: Register a new customer
 *     description: Create a new customer account with email, password and company information
 *     tags:
 *       - Customer Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - companyName
 *               - companyUserId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "customer@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               companyName:
 *                 type: string
 *                 example: "Acme Corporation"
 *               companyUserId:
 *                 type: string
 *                 example: "user_67890"
 *     responses:
 *       201:
 *         description: Customer successfully registered
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
 *                   example: "Customer registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     customer:
 *                       $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Bad request - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", CustomerAuthController.register);

/**
 * @swagger
 * /api/v1/customer/login:
 *   post:
 *     summary: Customer login
 *     description: Authenticate a customer with email and password
 *     tags:
 *       - Customer Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "customer@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", CustomerAuthController.login);

export { router as customerAuthRoutes };