"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfController = void 0;
const text2pdf_service_1 = require("./text2pdf.service");
const validation_util_1 = require("./utils/validation.util");
const text2pdf_util_1 = require("./utils/text2pdf.util");
const error_util_1 = require("./utils/error.util");
class PdfController {
    /**
     * Generate PDF document with automatic download
     */
    static async generatePdf(req, res) {
        try {
            // Validate request
            const validation = validation_util_1.ValidationUtil.validatePdfRequest(req.body);
            if (!validation.isValid) {
                res.status(400).json(error_util_1.ErrorUtil.createErrorResponse('Validation failed', validation.errors));
                return;
            }
            const request = req.body;
            // Generate PDF
            //   const pdfBuffer = await PdfService.generatePdf(request);
            const pdfBuffer = await text2pdf_service_1.PdfService.generateIncidentReportPdf(request.id, request.description);
            const filename = text2pdf_util_1.PdfUtil.generateFilename(request.id, request.template);
            // Set headers for automatic download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            // Additional headers to ensure browser download
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            res.setHeader('X-Suggested-Filename', filename);
            // Send PDF
            res.send(pdfBuffer);
        }
        catch (error) {
            error_util_1.ErrorUtil.logError('PdfController.generatePdf', error);
            res.status(500).json(error_util_1.ErrorUtil.createErrorResponse('PDF generation failed', [error.message]));
        }
    }
    /**
     * Preview PDF document (inline display)
     */
    static async previewPdf(req, res) {
        try {
            // Validate request
            const validation = validation_util_1.ValidationUtil.validatePdfRequest(req.body);
            if (!validation.isValid) {
                res.status(400).json(error_util_1.ErrorUtil.createErrorResponse('Validation failed', validation.errors));
                return;
            }
            const request = req.body;
            // Generate PDF
            const pdfBuffer = await text2pdf_service_1.PdfService.generatePdf(request);
            const filename = text2pdf_util_1.PdfUtil.generateFilename(request.id, request.template);
            // Set response headers for inline display
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            // Send PDF
            res.send(pdfBuffer);
        }
        catch (error) {
            error_util_1.ErrorUtil.logError('PdfController.previewPdf', error);
            res.status(500).json(error_util_1.ErrorUtil.createErrorResponse('PDF preview failed', [error.message]));
        }
    }
    /**
     * Generate PDF and return JSON response with download info
     */
    static async generatePdfWithInfo(req, res) {
        try {
            // Validate request
            const validation = validation_util_1.ValidationUtil.validatePdfRequest(req.body);
            if (!validation.isValid) {
                res.status(400).json(error_util_1.ErrorUtil.createErrorResponse('Validation failed', validation.errors));
                return;
            }
            const request = req.body;
            // Generate PDF
            const pdfBuffer = await text2pdf_service_1.PdfService.generatePdf(request);
            const filename = text2pdf_util_1.PdfUtil.generateFilename(request.id, request.template);
            // Store PDF temporarily (in production, use proper storage)
            // This is a simplified example - implement proper file storage
            res.json({
                success: true,
                message: 'PDF generated successfully',
                filename,
                size: pdfBuffer.length,
                downloadUrl: `/api/pdf/download/${request.id}`,
                previewUrl: `/api/pdf/preview-by-id/${request.id}`
            });
        }
        catch (error) {
            error_util_1.ErrorUtil.logError('PdfController.generatePdfWithInfo', error);
            res.status(500).json(error_util_1.ErrorUtil.createErrorResponse('PDF generation failed', [error.message]));
        }
    }
    /**
     * Download PDF by ID
     */
    static async downloadById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json(error_util_1.ErrorUtil.createErrorResponse('Document ID is required'));
                return;
            }
            // In a real application, retrieve the PDF from storage
            // For this example, we'll generate a new one
            const request = {
                id,
                description: 'Retrieved document content',
                template: 'standard'
            };
            const pdfBuffer = await text2pdf_service_1.PdfService.generatePdf(request);
            const filename = text2pdf_util_1.PdfUtil.generateFilename(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        }
        catch (error) {
            error_util_1.ErrorUtil.logError('PdfController.downloadById', error);
            res.status(404).json(error_util_1.ErrorUtil.createErrorResponse('PDF not found', [error.message]));
        }
    }
    /**
     * Get available templates
     */
    static getTemplates(req, res) {
        try {
            const templates = [
                {
                    name: 'standard',
                    description: 'Standard business document template',
                    features: ['Company header', 'Metadata section', 'Signature block']
                },
                {
                    name: 'executive',
                    description: 'Executive summary template with enhanced formatting',
                    features: ['Enhanced margins', 'Professional styling', 'Executive branding']
                },
                {
                    name: 'minimal',
                    description: 'Clean minimal template for simple documents',
                    features: ['Simple layout', 'Reduced margins', 'Clean typography']
                }
            ];
            res.json({
                success: true,
                message: 'Templates retrieved successfully',
                data: templates
            });
        }
        catch (error) {
            error_util_1.ErrorUtil.logError('PdfController.getTemplates', error);
            res.status(500).json(error_util_1.ErrorUtil.createErrorResponse('Failed to retrieve templates'));
        }
    }
}
exports.PdfController = PdfController;
