import { Request, Response } from 'express';
import { PdfService } from './text2pdf.service';
import { ValidationUtil } from './utils/validation.util';
import { PdfUtil } from './utils/text2pdf.util';
import { ErrorUtil } from './utils/error.util';
import { PdfGenerationRequest } from './text2pdf.types';

export class PdfController {
  /**
   * Generate PDF document with automatic download
   */
  static async generatePdf(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const validation = ValidationUtil.validatePdfRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json(ErrorUtil.createErrorResponse(
          'Validation failed', 
          validation.errors
        ));
        return;
      }

      const request: PdfGenerationRequest = req.body;

      // Generate PDF
    //   const pdfBuffer = await PdfService.generatePdf(request);
     const pdfBuffer = await PdfService.generateIncidentReportPdf(request.id, request.description);
      const filename = PdfUtil.generateFilename(request.id, request.template);

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

    } catch (error:any) {
      ErrorUtil.logError('PdfController.generatePdf', error);
      res.status(500).json(ErrorUtil.createErrorResponse(
        'PDF generation failed',
        [error.message]
      ));
    }
  }

  /**
   * Preview PDF document (inline display)
   */
  static async previewPdf(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const validation = ValidationUtil.validatePdfRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json(ErrorUtil.createErrorResponse(
          'Validation failed', 
          validation.errors
        ));
        return;
      }

      const request: PdfGenerationRequest = req.body;

      // Generate PDF
      const pdfBuffer = await PdfService.generatePdf(request);
      const filename = PdfUtil.generateFilename(request.id, request.template);

      // Set response headers for inline display
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Send PDF
      res.send(pdfBuffer);

    } catch (error:any) {
      ErrorUtil.logError('PdfController.previewPdf', error);
      res.status(500).json(ErrorUtil.createErrorResponse(
        'PDF preview failed',
        [error.message]
      ));
    }
  }

  /**
   * Generate PDF and return JSON response with download info
   */
  static async generatePdfWithInfo(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const validation = ValidationUtil.validatePdfRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json(ErrorUtil.createErrorResponse(
          'Validation failed', 
          validation.errors
        ));
        return;
      }

      const request: PdfGenerationRequest = req.body;

      // Generate PDF
      const pdfBuffer = await PdfService.generatePdf(request);
      const filename = PdfUtil.generateFilename(request.id, request.template);

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

    } catch (error:any) {
      ErrorUtil.logError('PdfController.generatePdfWithInfo', error);
      res.status(500).json(ErrorUtil.createErrorResponse(
        'PDF generation failed',
        [error.message]
      ));
    }
  }

  /**
   * Download PDF by ID
   */
  static async downloadById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json(ErrorUtil.createErrorResponse(
          'Document ID is required'
        ));
        return;
      }

      // In a real application, retrieve the PDF from storage
      // For this example, we'll generate a new one
      const request: PdfGenerationRequest = {
        id,
        description: 'Retrieved document content',
        template: 'standard'
      };

      const pdfBuffer = await PdfService.generatePdf(request);
      const filename = PdfUtil.generateFilename(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

    } catch (error:any) {
      ErrorUtil.logError('PdfController.downloadById', error);
      res.status(404).json(ErrorUtil.createErrorResponse(
        'PDF not found',
        [error.message]
      ));
    }
  }

  /**
   * Get available templates
   */
  static getTemplates(req: Request, res: Response): void {
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

    } catch (error) {
      ErrorUtil.logError('PdfController.getTemplates', error);
      res.status(500).json(ErrorUtil.createErrorResponse(
        'Failed to retrieve templates'
      ));
    }
  }
}