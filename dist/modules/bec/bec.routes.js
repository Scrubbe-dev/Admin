"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bec_service_1 = require("../bec/bec.service");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const analyzer = new bec_service_1.EmailAnalyzer();
/**
 * @swagger
 * /api/v1/analyze:
 *   post:
 *     summary: Analyze email for Business Email Compromise (BEC) risks
 *     description: |
 *       Performs comprehensive analysis of email content, sender information, and domain characteristics
 *       to detect potential Business Email Compromise (BEC) threats. The analysis includes:
 *       - Domain authentication checks (SPF/DMARC)
 *       - Lookalike domain detection
 *       - Display name spoofing detection
 *       - Content analysis for urgency indicators
 *     tags:
 *       - Email Analysis
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderEmail
 *               - displayName
 *               - subject
 *               - content
 *             properties:
 *               senderEmail:
 *                 type: string
 *                 format: email
 *                 example: "john.smith@example-corp.com"
 *                 description: Full email address of the sender
 *               displayName:
 *                 type: string
 *                 example: "John Smith"
 *                 description: Display name used in the email
 *               subject:
 *                 type: string
 *                 example: "Urgent Wire Transfer Request"
 *                 description: Email subject line
 *               content:
 *                 type: string
 *                 example: "We need to immediately process a confidential wire transfer..."
 *                 description: Full email body content
 *               legitimateDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["examplecorp.com"]
 *                 description: List of known legitimate domains for comparison
 *     responses:
 *       200:
 *         description: Successful analysis with detailed threat assessment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request_id:
 *                   type: string
 *                   example: "bec-req-12345abcde"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-04T15:30:45Z"
 *                 status:
 *                   type: string
 *                   enum: [completed, failed]
 *                   example: "completed"
 *                 risk_score:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 100
 *                   example: 87
 *                 verdict:
 *                   type: string
 *                   enum: [low_risk, medium_risk, high_risk]
 *                   example: "high_risk"
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     domain_analysis:
 *                       type: object
 *                       properties:
 *                         is_suspicious:
 *                           type: boolean
 *                           example: true
 *                         findings:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: "lookalike_domain"
 *                               description:
 *                                 type: string
 *                                 example: "Sender domain appears to be imitating legitimate domain"
 *                               confidence:
 *                                 type: number
 *                                 format: float
 *                                 minimum: 0
 *                                 maximum: 1
 *                                 example: 0.92
 *                     sender_analysis:
 *                       type: object
 *                       properties:
 *                         is_suspicious:
 *                           type: boolean
 *                           example: true
 *                         findings:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: "display_name_spoofing"
 *                               description:
 *                                 type: string
 *                                 example: "Display name matches known contact but from different domain"
 *                               confidence:
 *                                 type: number
 *                                 format: float
 *                                 example: 0.88
 *                     content_analysis:
 *                       type: object
 *                       properties:
 *                         is_suspicious:
 *                           type: boolean
 *                           example: true
 *                         findings:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: "urgency_indicators"
 *                               description:
 *                                 type: string
 *                                 example: "Email uses urgent language commonly seen in BEC attacks"
 *                               confidence:
 *                                 type: number
 *                                 format: float
 *                                 example: 0.75
 *                               keywords:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                                 example: ["urgent", "immediate", "wire transfer", "confidential"]
 *                 iocs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [email, domain, pattern]
 *                         example: "email"
 *                       value:
 *                         type: string
 *                         example: "john.smith@example-corp.com"
 *                       description:
 *                         type: string
 *                         example: "Suspected spoofed sender address"
 *                       confidence:
 *                         type: string
 *                         enum: [low, medium, high]
 *                         example: "high"
 *                 recommended_actions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                         example: "block_sender"
 *                       description:
 *                         type: string
 *                         example: "Block emails from this sender domain"
 *                       automated:
 *                         type: boolean
 *                         example: false
 *                 _metadata:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     env:
 *                       type: string
 *                       example: "production"
 *       400:
 *         description: Bad request (invalid input parameters)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request_id:
 *                   type: string
 *                   example: "req-12345"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-04T15:30:45Z"
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Invalid request payload"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized (missing or invalid API key)
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request_id:
 *                   type: string
 *                   example: "req-12345"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-04T15:30:45Z"
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 code:
 *                   type: string
 *                   example: "INTERNAL_SERVER_ERROR"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */
router.post('/analyze', 
//   requestIdMiddleware,
//   authMiddleware as any,
//   rateLimitMiddleware,
//   validationMiddleware as any,
async (req, res) => {
    try {
        const request = {
            senderEmail: req.body.senderEmail,
            displayName: req.body.displayName,
            subject: req.body.subject,
            content: req.body.content,
            legitimateDomains: req.body.legitimateDomains,
        };
        const report = await analyzer.analyzeEmail(request);
        res.status(200).json({
            ...report,
            // _metadata: {
            //   version: process.env.npm_package_version,
            //   env: process.env.NODE_ENV,
            // },
        });
    }
    catch (error) {
        res.status(500).json({
            request_id: req.requestId,
            timestamp: new Date().toISOString(),
            status: 'error',
            code: 'PROCESSING_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
    }
});
exports.default = router;
