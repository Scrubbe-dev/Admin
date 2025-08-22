import { Router } from 'express';
import { PdfController } from './text2pdf.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/generate-pdf:
 *   post:
 *     summary: Generate and download PDF document
 *     description: Creates a PDF file with the provided content and automatically triggers download in the browser
 *     tags:
 *       - PDF Generation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PdfGenerationRequest'
 *           examples:
 *             standard_document:
 *               summary: Standard business document
 *               value:
 *                 id: "RPT-2024-Q4-001"
 *                 description: "This comprehensive quarterly report provides detailed analysis of our business performance, including revenue growth, market expansion, and strategic initiatives implemented during Q4 2024."
 *                 template: "standard"
 *                 metadata:
 *                   title: "Q4 2024 Business Report"
 *                   author: "Jane Doe"
 *                   subject: "Quarterly Business Analysis"
 *                   department: "Business Intelligence"
 *             executive_summary:
 *               summary: Executive summary document
 *               value:
 *                 id: "EXEC-2024-001"
 *                 description: "Executive summary outlining key strategic decisions and their impact on organizational growth and market positioning."
 *                 template: "executive"
 *                 metadata:
 *                   title: "Executive Strategic Summary"
 *                   author: "CEO Office"
 *                   subject: "Strategic Planning"
 *                   department: "Executive"
 *     responses:
 *       200:
 *         description: PDF generated successfully and ready for download
 *         headers:
 *           Content-Type:
 *             description: MIME type of the response
 *             schema:
 *               type: string
 *               example: application/pdf
 *           Content-Disposition:
 *             description: Indicates file should be downloaded
 *             schema:
 *               type: string
 *               example: attachment; filename="standard-RPT-2024-Q4-001-2024-08-21_14-30-00.pdf"
 *           Content-Length:
 *             description: Size of the PDF file in bytes
 *             schema:
 *               type: integer
 *               example: 245760
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error during PDF generation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.post('/generate-pdf', PdfController.generatePdf);

/**
 * @swagger
 * /api/v1/preview:
 *   post:
 *     summary: Preview PDF document inline
 *     description: Generates a PDF and displays it inline in the browser without triggering download
 *     tags:
 *       - PDF Generation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PdfGenerationRequest'
 *     responses:
 *       200:
 *         description: PDF generated successfully for preview
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: application/pdf
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: inline; filename="preview.pdf"
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error during PDF generation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.post('/preview', PdfController.previewPdf);

/**
 * @swagger
 * /api/v1/templates:
 *   get:
 *     summary: Get available PDF templates
 *     description: Retrieves a list of all available PDF templates with their descriptions
 *     tags:
 *       - Templates
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TemplatesResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.get('/templates', PdfController.getTemplates);

/**
 * @swagger
 * /api/v1/download/{id}:
 *   get:
 *     summary: Download previously generated PDF
 *     description: Download a PDF that was previously generated and stored
 *     tags:
 *       - PDF Generation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The document ID
 *         example: "RPT-2024-Q4-001"
 *     responses:
 *       200:
 *         description: PDF downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: PDF not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.get('/download/:id', PdfController.downloadById);

export { router as pdfRoutes };

