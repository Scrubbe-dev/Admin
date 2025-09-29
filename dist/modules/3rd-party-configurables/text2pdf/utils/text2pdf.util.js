"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfUtil = void 0;
class PdfUtil {
    /**
     * Generate unique filename for PDF
     */
    static generateFilename(id, template = 'standard') {
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];
        return `${template}-${id}-${timestamp}.pdf`;
    }
    /**
     * Add company header to PDF
     */
    static addCompanyHeader(doc, branding, template) {
        const { companyName, address, phone, email, website } = branding;
        // Company name
        doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text(companyName, 50, 50, { align: 'left' });
        // Header line
        doc.strokeColor('#3498db')
            .lineWidth(2)
            .moveTo(50, 80)
            .lineTo(doc.page.width - 50, 80)
            .stroke();
        // Company contact info
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#7f8c8d')
            .text(`${address} | Tel: ${phone} | Email: ${email} | Web: ${website}`, 50, 85, { align: 'center' });
    }
    /**
     * Add company footer to PDF
     */
    static addCompanyFooter(doc, branding, pageNumber, totalPages) {
        const footerY = doc.page.height - 50;
        // Footer line
        doc.strokeColor('#bdc3c7')
            .lineWidth(1)
            .moveTo(50, footerY - 15)
            .lineTo(doc.page.width - 50, footerY - 15)
            .stroke();
        // Footer text
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#95a5a6')
            .text(`${branding.companyName} - Confidential Document`, 50, footerY, { align: 'left' })
            .text(`Page ${pageNumber} of ${totalPages}`, 50, footerY, { align: 'right' });
        // Generation timestamp
        doc.text(`Generated on ${new Date().toLocaleString()}`, 50, footerY + 12, { align: 'center' });
    }
    /**
     * Get template configuration
     */
    static getTemplate(templateName = 'standard') {
        const templates = {
            standard: {
                name: 'Standard',
                headerHeight: 120,
                footerHeight: 60,
                margins: { top: 140, bottom: 80, left: 50, right: 50 }
            },
            executive: {
                name: 'Executive',
                headerHeight: 140,
                footerHeight: 70,
                margins: { top: 160, bottom: 90, left: 60, right: 60 }
            },
            minimal: {
                name: 'Minimal',
                headerHeight: 80,
                footerHeight: 40,
                margins: { top: 100, bottom: 60, left: 40, right: 40 }
            }
        };
        return templates[templateName] || templates.standard;
    }
}
exports.PdfUtil = PdfUtil;
