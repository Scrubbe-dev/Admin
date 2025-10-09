// organizationRoutes.ts
import { NextFunction, Router  , Request , Response} from "express";
import { CustomerAuthController } from "../controllers/customerAuthController";
import { authenticateCustomer } from "../middleware/customerMiddleware"; // Your existing user auth middleware

const router = Router();

/**
 * @swagger
 * /api/v1/organization/customers:
 *   get:
 *     summary: Get organization customers
 *     description: Retrieve all customers registered under the authenticated organization
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved organization customers
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
 *                   example: "Organization customers retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         business:
 *                           type: object
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     stats:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/customers",
  (req: Request, res: Response, next: NextFunction) => {
     authenticateCustomer(req, res, next);
   },
 (req: Request, res: Response, next: NextFunction) => {
  CustomerAuthController.getOrganizationCustomers(req,res)
 }
);

export { router as organizationRoutes };