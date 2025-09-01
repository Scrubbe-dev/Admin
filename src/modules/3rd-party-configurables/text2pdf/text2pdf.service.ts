import PDFDocument from 'pdfkit';
import { PdfGenerationRequest, CompanyBranding, PdfGenerationResponse } from './text2pdf.types';
import { PdfUtil } from './utils/text2pdf.util';
import { ErrorUtil } from './utils/error.util';
import prisma from '../../../lib/prisma';
import { IncidentTicket, IncidentStatus, Priority, IncidentTemplate, DetermineAction } from '@prisma/client';

// Enhanced interface for incident data
interface IncidentReportData extends IncidentTicket {
  timeline?: IncidentTimelineEntry[];
  affectedSystems?: string[];
  customerImpact?: {
    usersAffected: number;
    downtime: number; // in minutes
    slasBreached: string[];
    financialImpact?: number;
  };
  rootCause?: {
    technical: string;
    contributingFactors: string[];
    hypothesis?: string;
  };
  resolutionDetails?: {
    mitigationSteps: string[];
    permanentFix?: string;
    workarounds: string[];
  };
  lessonsLearned?: {
    wentWell: string[];
    improvements: string[];
    insights: string[];
  };
  actionItems?: ActionItem[];
}

interface IncidentTimelineEntry {
  timestamp: Date;
  event: string;
  description: string;
  actor: string;
}

interface ActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate: Date;
  priority: Priority;
  status: IncidentStatus
}

export class PdfService {
  private static readonly COMPANY_BRANDING: CompanyBranding = {
    companyName: 'Scrubbe Corporation',
    address: '123 Business Ave, Corporate City, CC 12345',
    phone: '+1 (555) 123-4567',
    email: 'contact@scrubbe.com',
    website: 'www.scrubbe.com'
  };

  // Enhanced design constants
  private static readonly DESIGN = {
    colors: {
      primary: '#1a365d',
      secondary: '#2d3748',
      accent: '#3182ce',
      text: '#2d3748',
      lightGray: '#f7fafc',
      borderGray: '#e2e8f0',
      mutedText: '#718096',
      success: '#38a169',
      warning: '#d69e2e',
      danger: '#e53e3e',
      p1: '#e53e3e', // Critical
      p2: '#d69e2e', // High
      p3: '#3182ce', // Medium
      p4: '#38a169'  // Low
    },
    spacing: {
      section: 25,
      subsection: 18,
      line: 14,
      tight: 10,
      micro: 6
    },
    margins: {
      page: 50,
      content: 60,
      box: 20
    },
    fonts: {
      title: 24,
      heading: 16,
      subheading: 14,
      body: 11,
      small: 9,
      micro: 8
    }
  };

  /**
   * Generate incident report PDF
   */
  static async generateIncidentReportPdf(incidentId: string, description:string): Promise<Buffer> {
    try {
      // Fetch incident data with related information
      const incidentData = await this.fetchIncidentData(incidentId,description);
      
      if (!incidentData) {
        throw new Error(`Incident with ID ${incidentId} not found`);
      }

      return this.generatePdfFromIncidentData(incidentData , description);
    } catch (error: any) {
      ErrorUtil.logError('PdfService.generateIncidentReportPdf', error);
      throw new Error(`Incident report PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Fetch comprehensive incident data
   */
private static async fetchIncidentData(incidentId: string, description:string): Promise<IncidentReportData | null> {
    const incident = await prisma.incidentTicket.findFirst({
      where: { id: incidentId },
      include: {
        // Include related data if available in your schema
      }
    });

    // Check if incident exists before proceeding
    if (!incident) return null;

    const mainIncident = await prisma.incident.findFirst({
        where: { incidentTicketId: incident.id },
        include: {
            // resolveIncident: true,
        }
    });

    // Fix: Only query for user if assignedToEmail exists
    let incidentUser = null;
    if (incident.assignedToEmail) {
        incidentUser = await prisma.user.findFirst({  
            where: { email: incident.assignedToEmail }
        });
    }

    const resolveIncident = await prisma.resolveIncident.findFirst({
         where: { incidentTicketId: incident.id }
    });

    // Generate timeline entries
    const timeline = await this.generateMockTimeline(incident);

    // Transform and enrich the data - Filter out N/A values properly
    const contributingFactors = [
      resolveIncident?.why1,
      resolveIncident?.why2,
      resolveIncident?.why3,
      resolveIncident?.why4,
      resolveIncident?.why5,
    ].filter(factor => factor && factor.trim() !== '' && factor.toLowerCase() !== 'n/a');
    
    const improvements = incident.recommendedActions ? 
      incident.recommendedActions.filter(action => action && action.trim() !== '' && action.toLowerCase() !== 'n/a') : [];

    return {
      ...incident,
      timeline: timeline, // Fix: Use the generated timeline array
      rootCause: {
        technical: resolveIncident?.rootCause || 'N/A',
        contributingFactors: (contributingFactors.length > 0 ? contributingFactors : ['']) as any[]
      },
      resolutionDetails: {
        mitigationSteps: resolveIncident?.followUpTask ? [resolveIncident.followUpTask] : [],
        permanentFix: resolveIncident?.permanentFix || 'N/A',
        workarounds: resolveIncident?.temporaryFix ? [resolveIncident.temporaryFix] : []
      },
      lessonsLearned: {
        wentWell: resolveIncident?.knowledgeSummaryInternal ? [resolveIncident.knowledgeSummaryInternal] : [],
        improvements: improvements,
        insights: resolveIncident?.preventiveMeasuresInternal ? [resolveIncident.preventiveMeasuresInternal] : []
      },
      actionItems: [
        {
          id: incident.id,
          description: incident.reason,
          // Fix: Handle case where incidentUser is null
          owner: incidentUser ? `${incidentUser.firstName || ''} ${incidentUser.lastName || ''}`.trim() || 'N/A' : 'N/A',
          dueDate: resolveIncident?.followUpDueDate as any,
          priority: incident.priority,
          status: incident.status  
        }
      ]
    };
  }
  /**
   * Generate timeline from incident data
   */
private static async generateMockTimeline(incident: IncidentTicket): Promise<IncidentTimelineEntry[]> {
    const timeline: IncidentTimelineEntry[] = [
      {
        timestamp: incident.createdAt,
        event: 'Incident Detected',
        description: 'Automated monitoring alert triggered for high response times',
        actor: 'Monitoring System'
      }
    ];
    
    if (incident.firstAcknowledgedAt) {
      timeline.push({
        timestamp: incident.firstAcknowledgedAt,
        event: 'Incident Acknowledged',
        description: 'On-call engineer acknowledged the alert',
        actor: incident.assignedToEmail || 'On-call Engineer' // Fix: Handle null case
      });
    }
    
    if (incident.resolvedAt) {
      timeline.push({
        timestamp: incident.resolvedAt,
        event: 'Incident Resolved',
        description: 'Root cause identified and fix deployed',
        actor: incident.assignedToEmail || 'Support Engineer' // Fix: Handle null case
      });
    }
    
    if (incident.closedAt) {
      timeline.push({
        timestamp: incident.closedAt,
        event: 'Incident Closed',
        description: 'Post-incident review completed',
        actor: 'Incident Manager'
      });
    }
    
    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  /**
   * Calculate downtime in minutes
   */
  private static calculateDowntime(incident: IncidentTicket): number {
    if (!incident.resolvedAt) return 0;
    return Math.floor((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60));
  }

  /**
   * Check if we need a new page and handle page breaks
   */
  private static checkPageBreak(doc: PDFKit.PDFDocument, requiredSpace: number = 60): void {
    const currentY = doc.y;
    const pageHeight = doc.page.height;
    const bottomMargin = this.DESIGN.margins.page;
    
    if (currentY + requiredSpace > pageHeight - bottomMargin) {
      doc.addPage();
      doc.y = this.DESIGN.margins.page;
    }
  }

  /**
   * Generate PDF from incident data
   */
  private static generatePdfFromIncidentData(incidentData: IncidentReportData, description:string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: this.DESIGN.margins.page,
            bottom: this.DESIGN.margins.page,
            left: this.DESIGN.margins.page,
            right: this.DESIGN.margins.page
          },
          bufferPages: true,
          info: {
            Title: `Incident Report - ${incidentData.ticketId}`,
            Author: this.COMPANY_BRANDING.companyName,
            Subject: 'Incident Post-Mortem Report',
            Creator: this.COMPANY_BRANDING.companyName,
            Producer: 'Scrubbe Incident Management System',
            CreationDate: new Date(),
            ModDate: new Date()
          }
        });

        const buffers: Buffer[] = [];
        
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Add all sections
        this.addIncidentReportContent(doc, incidentData, description);
        
        doc.end();

      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * Add complete incident report content
   */
  private static addIncidentReportContent(doc: PDFKit.PDFDocument, incident: IncidentReportData, description:string): void {
    const pageWidth = doc.page.width - (this.DESIGN.margins.page * 2);
    
    // 1. Header with incident metadata
    this.addIncidentHeader(doc, incident, pageWidth);
    
    // 2. Executive Summary
    this.addExecutiveSummary(doc, incident, pageWidth, description);
    
    // 3. Incident Timeline
    this.addIncidentTimeline(doc, incident, pageWidth);
    
    // 4. Root Cause Analysis
    this.addRootCauseAnalysis(doc, incident, pageWidth);
    
    // 5. Impact Analysis
    this.addImpactAnalysis(doc, incident, pageWidth);
    
    // 6. Resolution Details
    this.addResolutionDetails(doc, incident, pageWidth);
    
    // 7. Lessons Learned
    this.addLessonsLearned(doc, incident, pageWidth);
    
    // 8. Action Items
    this.addActionItems(doc, incident, pageWidth);
  }

  /**
   * Add incident header with key metadata
   */
  private static addIncidentHeader(doc: PDFKit.PDFDocument, incident: IncidentReportData, pageWidth: number): void {
    const headerHeight = 120;
    const startY = doc.y;

    // Header background
    doc.fillColor(this.DESIGN.colors.primary)
       .rect(this.DESIGN.margins.page, startY, pageWidth, headerHeight)
       .fill();

    // Title
    doc.fillColor('white')
       .fontSize(this.DESIGN.fonts.title)
       .font('Helvetica-Bold')
       .text('INCIDENT POST-MORTEM REPORT', 
             this.DESIGN.margins.content, 
             startY + 15, 
             { width: pageWidth - 40, align: 'center' });

    // Incident ID and Priority
    const priorityColor = this.getPriorityColor(incident.priority);
    doc.fontSize(this.DESIGN.fonts.heading)
       .fillColor(priorityColor)
       .text(`${incident.ticketId} - ${incident.priority} Priority`, 
             this.DESIGN.margins.content, 
             startY + 50, 
             { width: pageWidth - 40, align: 'center' });

    // Key metadata row
    const metaY = startY + 80;
    doc.fontSize(this.DESIGN.fonts.small)
       .fillColor('#e2e8f0');
    
    // Date created
    doc.text(`Created: ${incident.createdAt.toLocaleString()}`, 
             this.DESIGN.margins.content, metaY);
    
    // Status
    doc.text(`Status: ${incident.status}`, 
             this.DESIGN.margins.content + 200, metaY);
    
    // Duration
    if (incident.resolvedAt) {
      const duration = Math.floor((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60));
      doc.text(`Duration: ${duration} minutes`, 
               this.DESIGN.margins.content + 350, metaY);
    }

    doc.y = startY + headerHeight + this.DESIGN.spacing.section;
  }

  /**
   * Add executive summary section
   */
  private static addExecutiveSummary(doc: PDFKit.PDFDocument, incident: IncidentReportData, pageWidth: number, description:string): void {
    this.checkPageBreak(doc, 100);
    this.addSectionHeader(doc, 'Executive Summary', pageWidth);
    
    const summaryText = description || 'No summary available';
    
    doc.fontSize(this.DESIGN.fonts.body)
       .font('Helvetica')
       .fillColor(this.DESIGN.colors.text)
       .text(summaryText, 
             this.DESIGN.margins.content, 
             doc.y, {
               width: pageWidth - 40,
               align: 'justify',
               lineGap: 4
             });

    // Business Impact Box
    if (incident.customerImpact) {
      this.addBusinessImpactBox(doc, incident.customerImpact, pageWidth);
    }

    doc.y += this.DESIGN.spacing.section;
  }

  /**
   * Add business impact summary box
   */
  private static addBusinessImpactBox(doc: PDFKit.PDFDocument, impact: any, pageWidth: number): void {
    this.checkPageBreak(doc, 100);
    
    const boxHeight = 80;
    const startY = doc.y + this.DESIGN.spacing.subsection;
    const boxWidth = pageWidth - 40;

    // Impact box
    doc.fillColor('#fff5f5')
       .rect(this.DESIGN.margins.content, startY, boxWidth, boxHeight)
       .fill();

    doc.strokeColor('#fed7d7')
       .lineWidth(1)
       .rect(this.DESIGN.margins.content, startY, boxWidth, boxHeight)
       .stroke();

    // Impact header
    doc.fillColor(this.DESIGN.colors.danger)
       .fontSize(this.DESIGN.fonts.subheading)
       .font('Helvetica-Bold')
       .text('Business Impact', this.DESIGN.margins.content + 15, startY + 10);

    // Impact metrics
    const metricsY = startY + 35;
    doc.fontSize(this.DESIGN.fonts.small)
       .fillColor(this.DESIGN.colors.text)
       .font('Helvetica');

    doc.text(`• Users Affected: ${impact.usersAffected.toLocaleString()}`, 
             this.DESIGN.margins.content + 15, metricsY);
    doc.text(`• Downtime: ${impact.downtime} minutes`, 
             this.DESIGN.margins.content + 15, metricsY + 12);
    
    if (impact.financialImpact) {
      doc.text(`• Est. Financial Impact: $${impact.financialImpact.toLocaleString()}`, 
               this.DESIGN.margins.content + 15, metricsY + 24);
    }

    doc.y = startY + boxHeight + this.DESIGN.spacing.section;
  }

  /**
   * Add incident timeline section
   */
  private static addIncidentTimeline(doc: PDFKit.PDFDocument, incident: IncidentReportData, pageWidth: number): void {
    this.checkPageBreak(doc,100);
    this.addSectionHeader(doc, 'Incident Timeline', pageWidth);
    
    if (!incident.timeline || incident.timeline.length === 0) {
      doc.fontSize(this.DESIGN.fonts.body)
         .fillColor(this.DESIGN.colors.mutedText)
         .text('No timeline data available', this.DESIGN.margins.content, doc.y);
      doc.y += this.DESIGN.spacing.section;
      return;
    }

    // Timeline table header
    const tableStartY = doc.y;
    const colWidths = [120, 120, 200, 100];
    const headers = ['Time', 'Event', 'Description', 'Actor'];
    
    this.drawTableHeader(doc, headers, colWidths, tableStartY, pageWidth);
    
    // Timeline entries
    let currentY = tableStartY + 25;
    for (const entry of incident.timeline) {
      // Check if we need a new page
      this.checkPageBreak(doc, 25);
      currentY = doc.y;

      const rowData = [
        entry.timestamp.toLocaleTimeString(),
        entry.event,
        entry.description,
        entry.actor
      ];

      this.drawTableRow(doc, rowData, colWidths, currentY);
      doc.y = currentY + 25;
    }

    doc.y += this.DESIGN.spacing.section;
  }

  /**
   * Add root cause analysis section
   */
  private static addRootCauseAnalysis(doc: PDFKit.PDFDocument, incident: IncidentReportData, pageWidth: number): void {
    this.checkPageBreak(doc, 100);
    this.addSectionHeader(doc, 'Root Cause Analysis', pageWidth);
    
    if (incident.rootCause) {
      // Technical root cause
      doc.fontSize(this.DESIGN.fonts.subheading)
         .font('Helvetica-Bold')
         .fillColor(this.DESIGN.colors.secondary)
         .text('Technical Root Cause:', this.DESIGN.margins.content, doc.y);
      
      doc.y += this.DESIGN.spacing.tight;
      doc.fontSize(this.DESIGN.fonts.body)
         .font('Helvetica')
         .fillColor(this.DESIGN.colors.text)
         .text(incident.rootCause.technical, 
               this.DESIGN.margins.content, 
               doc.y, {
                 width: pageWidth - 40,
                 align: 'justify'
               });

      // Contributing factors - only show if there are valid factors
      if (incident.rootCause.contributingFactors && incident.rootCause.contributingFactors.length > 0) {
        doc.y += this.DESIGN.spacing.subsection;
        this.checkPageBreak(doc, 80);
        
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.secondary)
           .text('Contributing Factors:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        incident.rootCause.contributingFactors.forEach(factor => {
          this.checkPageBreak(doc, 20);
          doc.fontSize(this.DESIGN.fonts.body)
             .font('Helvetica')
             .fillColor(this.DESIGN.colors.text)
             .text(`• ${factor}`, this.DESIGN.margins.content + 15, doc.y);
          doc.y += this.DESIGN.spacing.line;
        });
      } else {
        doc.y += this.DESIGN.spacing.subsection;
        this.checkPageBreak(doc, 40);
        
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.secondary)
           .text('Contributing Factors:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        doc.fontSize(this.DESIGN.fonts.body)
           .font('Helvetica')
           .fillColor(this.DESIGN.colors.mutedText)
           .text('N/A', this.DESIGN.margins.content + 15, doc.y);
        doc.y += this.DESIGN.spacing.line;
      }
    }

    doc.y += this.DESIGN.spacing.section;
  }

  /**
   * Add impact analysis section
   */
  private static addImpactAnalysis(doc: PDFKit.PDFDocument, incident: IncidentReportData, pageWidth: number): void {
    this.checkPageBreak(doc, 80);
    this.addSectionHeader(doc, 'Impact Analysis', pageWidth);
    
    // Systems affected
    if (incident.affectedSystems && incident.affectedSystems.length > 0) {
      doc.fontSize(this.DESIGN.fonts.subheading)
         .font('Helvetica-Bold')
         .fillColor(this.DESIGN.colors.secondary)
         .text('Affected Systems:', this.DESIGN.margins.content, doc.y);
      
      doc.y += this.DESIGN.spacing.tight;
      incident.affectedSystems.forEach(system => {
        this.checkPageBreak(doc, 20);
        doc.fontSize(this.DESIGN.fonts.body)
           .font('Helvetica')
           .fillColor(this.DESIGN.colors.text)
           .text(`• ${system}`, this.DESIGN.margins.content + 15, doc.y);
        doc.y += this.DESIGN.spacing.line;
      });
    } else {
      doc.fontSize(this.DESIGN.fonts.subheading)
         .font('Helvetica-Bold')
         .fillColor(this.DESIGN.colors.secondary)
         .text('Affected Systems:', this.DESIGN.margins.content, doc.y);
      
      doc.y += this.DESIGN.spacing.tight;
      doc.fontSize(this.DESIGN.fonts.body)
         .font('Helvetica')
         .fillColor(this.DESIGN.colors.mutedText)
         .text('N/A', this.DESIGN.margins.content + 15, doc.y);
      doc.y += this.DESIGN.spacing.line;
    }

    doc.y += this.DESIGN.spacing.section;
  }

  /**
   * Add resolution details section
   */
  private static addResolutionDetails(doc: PDFKit.PDFDocument, incident: IncidentReportData, pageWidth: number): void {
    this.checkPageBreak(doc, 100);
    this.addSectionHeader(doc, 'Resolution Details', pageWidth);
    
    if (incident.resolutionDetails) {
      // Mitigation steps
      if (incident.resolutionDetails.mitigationSteps && incident.resolutionDetails.mitigationSteps.length > 0) {
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.secondary)
           .text('Mitigation Steps:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        incident.resolutionDetails.mitigationSteps.forEach((step, index) => {
          this.checkPageBreak(doc, 20);
          doc.fontSize(this.DESIGN.fonts.body)
             .font('Helvetica')
             .fillColor(this.DESIGN.colors.text)
             .text(`${index + 1}. ${step}`, this.DESIGN.margins.content + 15, doc.y);
          doc.y += this.DESIGN.spacing.line;
        });
      } else {
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.secondary)
           .text('Mitigation Steps:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        doc.fontSize(this.DESIGN.fonts.body)
           .font('Helvetica')
           .fillColor(this.DESIGN.colors.mutedText)
           .text('N/A', this.DESIGN.margins.content + 15, doc.y);
        doc.y += this.DESIGN.spacing.line;
      }

      // Permanent fix
      doc.y += this.DESIGN.spacing.subsection;
      this.checkPageBreak(doc, 60);
      
      doc.fontSize(this.DESIGN.fonts.subheading)
         .font('Helvetica-Bold')
         .fillColor(this.DESIGN.colors.secondary)
         .text('Permanent Fix:', this.DESIGN.margins.content, doc.y);
      
      doc.y += this.DESIGN.spacing.tight;
      doc.fontSize(this.DESIGN.fonts.body)
         .font('Helvetica')
         .fillColor(this.DESIGN.colors.text)
         .text(incident.resolutionDetails.permanentFix || 'N/A', 
               this.DESIGN.margins.content, 
               doc.y, {
                 width: pageWidth - 40,
                 align: 'justify'
               });

      // Workarounds
      if (incident.resolutionDetails.workarounds && incident.resolutionDetails.workarounds.length > 0) {
        doc.y += this.DESIGN.spacing.subsection;
        this.checkPageBreak(doc, 60);
        
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.secondary)
           .text('Workarounds:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        incident.resolutionDetails.workarounds.forEach((workaround, index) => {
          this.checkPageBreak(doc, 20);
          doc.fontSize(this.DESIGN.fonts.body)
             .font('Helvetica')
             .fillColor(this.DESIGN.colors.text)
             .text(`• ${workaround}`, this.DESIGN.margins.content + 15, doc.y);
          doc.y += this.DESIGN.spacing.line;
        });
      } else {
        doc.y += this.DESIGN.spacing.subsection;
        this.checkPageBreak(doc, 40);
        
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.secondary)
           .text('Workarounds:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        doc.fontSize(this.DESIGN.fonts.body)
           .font('Helvetica')
           .fillColor(this.DESIGN.colors.mutedText)
           .text('N/A', this.DESIGN.margins.content + 15, doc.y);
        doc.y += this.DESIGN.spacing.line;
      }
    }

    doc.y += this.DESIGN.spacing.section;
  }

  /**
   * Add lessons learned section
   */
  private static addLessonsLearned(doc: PDFKit.PDFDocument, incident: IncidentReportData, pageWidth: number): void {
    this.checkPageBreak(doc, 100);
    this.addSectionHeader(doc, 'Lessons Learned', pageWidth);
    
    if (incident.lessonsLearned) {
      // What went well
      if (incident.lessonsLearned.wentWell && incident.lessonsLearned.wentWell.length > 0) {
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.success)
           .text('What Went Well:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        incident.lessonsLearned.wentWell.forEach(item => {
          this.checkPageBreak(doc, 20);
          doc.fontSize(this.DESIGN.fonts.body)
             .font('Helvetica')
             .fillColor(this.DESIGN.colors.text)
             .text(`• ${item}`, this.DESIGN.margins.content + 15, doc.y);
          doc.y += this.DESIGN.spacing.line;
        });
      } else {
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.success)
           .text('What Went Well:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        doc.fontSize(this.DESIGN.fonts.body)
           .font('Helvetica')
           .fillColor(this.DESIGN.colors.mutedText)
           .text('N/A', this.DESIGN.margins.content + 15, doc.y);
        doc.y += this.DESIGN.spacing.line;
      }

      // Areas for improvement
      if (incident.lessonsLearned.improvements && incident.lessonsLearned.improvements.length > 0) {
        doc.y += this.DESIGN.spacing.subsection;
        this.checkPageBreak(doc, 60);
        
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.warning)
           .text('Areas for Improvement:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        incident.lessonsLearned.improvements.forEach(item => {
          this.checkPageBreak(doc, 20);
          doc.fontSize(this.DESIGN.fonts.body)
             .font('Helvetica')
             .fillColor(this.DESIGN.colors.text)
             .text(`• ${item}`, this.DESIGN.margins.content + 15, doc.y);
          doc.y += this.DESIGN.spacing.line;
        });
      } else {
        doc.y += this.DESIGN.spacing.subsection;
        this.checkPageBreak(doc, 40);
        
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.warning)
           .text('Areas for Improvement:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        doc.fontSize(this.DESIGN.fonts.body)
           .font('Helvetica')
           .fillColor(this.DESIGN.colors.mutedText)
           .text('N/A', this.DESIGN.margins.content + 15, doc.y);
        doc.y += this.DESIGN.spacing.line;
      }

      // Insights
      if (incident.lessonsLearned.insights && incident.lessonsLearned.insights.length > 0) {
        doc.y += this.DESIGN.spacing.subsection;
        this.checkPageBreak(doc, 60);
        
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.accent)
           .text('Key Insights:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        incident.lessonsLearned.insights.forEach(item => {
          this.checkPageBreak(doc, 20);
          doc.fontSize(this.DESIGN.fonts.body)
             .font('Helvetica')
             .fillColor(this.DESIGN.colors.text)
             .text(`• ${item}`, this.DESIGN.margins.content + 15, doc.y);
          doc.y += this.DESIGN.spacing.line;
        });
      } else {
        doc.y += this.DESIGN.spacing.subsection;
        this.checkPageBreak(doc, 40);
        
        doc.fontSize(this.DESIGN.fonts.subheading)
           .font('Helvetica-Bold')
           .fillColor(this.DESIGN.colors.accent)
           .text('Key Insights:', this.DESIGN.margins.content, doc.y);
        
        doc.y += this.DESIGN.spacing.tight;
        doc.fontSize(this.DESIGN.fonts.body)
           .font('Helvetica')
           .fillColor(this.DESIGN.colors.mutedText)
           .text('N/A', this.DESIGN.margins.content + 15, doc.y);
        doc.y += this.DESIGN.spacing.line;
      }
    }

    doc.y += this.DESIGN.spacing.section;
  }

  /**
   * Add action items section
   */
  private static addActionItems(doc: PDFKit.PDFDocument, incident: IncidentReportData, pageWidth: number): void {
    this.checkPageBreak(doc, 100);
    this.addSectionHeader(doc, 'Action Items & Owners', pageWidth);
    
    if (!incident.actionItems || incident.actionItems.length === 0) {
      doc.fontSize(this.DESIGN.fonts.body)
         .fillColor(this.DESIGN.colors.mutedText)
         .text('No action items defined', this.DESIGN.margins.content, doc.y);
      doc.y += this.DESIGN.spacing.section;
      return;
    }

    // Action items table
    const tableStartY = doc.y;
    const colWidths = [80, 200, 100, 80, 80];
    const headers = ['ID', 'Description', 'Owner', 'Due Date', 'Status'];
    
    this.drawTableHeader(doc, headers, colWidths, tableStartY, pageWidth);
    
    let currentY = tableStartY + 25;
    for (const item of incident.actionItems) {
      this.checkPageBreak(doc, 25);
      currentY = doc.y;

      const rowData = [
        item.id || 'N/A',
        item.description || 'N/A',
        item.owner || 'N/A',
        item?.dueDate?.toLocaleDateString() || 'N/A',
        item.status || 'N/A'
      ];

      this.drawTableRow(doc, rowData, colWidths, currentY);
      doc.y = currentY + 25;
    }

    doc.y += this.DESIGN.spacing.section;
  }

  // Helper methods
  private static addSectionHeader(doc: PDFKit.PDFDocument, title: string, pageWidth: number): void {
    doc.fontSize(this.DESIGN.fonts.heading)
       .font('Helvetica-Bold')
       .fillColor(this.DESIGN.colors.primary)
       .text(title, this.DESIGN.margins.content, doc.y);

    const lineY = doc.y + this.DESIGN.spacing.micro;
    doc.strokeColor(this.DESIGN.colors.accent)
       .lineWidth(2)
       .moveTo(this.DESIGN.margins.content, lineY)
       .lineTo(this.DESIGN.margins.content + 150, lineY)
       .stroke();

    doc.y = lineY + this.DESIGN.spacing.subsection;
  }

  private static getPriorityColor(priority: Priority): string {
    switch (priority) {
      case 'CRITICAL': return this.DESIGN.colors.p1;
      case 'HIGH': return this.DESIGN.colors.p2;
      case 'MEDIUM': return this.DESIGN.colors.p3;
      case 'LOW': return this.DESIGN.colors.p4;
      default: return this.DESIGN.colors.secondary;
    }
  }

  private static drawTableHeader(doc: PDFKit.PDFDocument, headers: string[], colWidths: number[], y: number, pageWidth: number): void {
    let currentX = this.DESIGN.margins.content;
    
    // Header background
    doc.fillColor(this.DESIGN.colors.lightGray)
       .rect(currentX, y, pageWidth - 40, 25)
       .fill();

    // Header text
    doc.fontSize(this.DESIGN.fonts.small)
       .font('Helvetica-Bold')
       .fillColor(this.DESIGN.colors.secondary);

    headers.forEach((header, index) => {
      doc.text(header, currentX + 5, y + 8, { width: colWidths[index] - 10 });
      currentX += colWidths[index];
    });

    // Header border
    doc.strokeColor(this.DESIGN.colors.borderGray)
       .lineWidth(1)
       .rect(this.DESIGN.margins.content, y, pageWidth - 40, 25)
       .stroke();
  }

  private static drawTableRow(doc: PDFKit.PDFDocument, rowData: string[], colWidths: number[], y: number): void {
    let currentX = this.DESIGN.margins.content;
    
    doc.fontSize(this.DESIGN.fonts.small)
       .font('Helvetica')
       .fillColor(this.DESIGN.colors.text);

    rowData.forEach((data, index) => {
      doc.text(data || 'N/A', currentX + 5, y + 5, { 
        width: colWidths[index] - 10,
        ellipsis: true 
      });
      currentX += colWidths[index];
    });

    // Row border
    doc.strokeColor(this.DESIGN.colors.borderGray)
       .lineWidth(0.5)
       .moveTo(this.DESIGN.margins.content, y + 20)
       .lineTo(this.DESIGN.margins.content + colWidths.reduce((a, b) => a + b, 0), y + 20)
       .stroke();
  }

  /**
   * Legacy method for backward compatibility
   */
  static async generatePdf(request: PdfGenerationRequest): Promise<Buffer> {
    // If this is an incident report, use the new method
    if (request.template === 'incident' || request.metadata?.type === 'incident') {
      return this.generateIncidentReportPdf(request.id, request.description);
    }
    
    // Fall back to original implementation for other document types
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: this.DESIGN.margins.page,
            bottom: this.DESIGN.margins.page,
            left: this.DESIGN.margins.page,
            right: this.DESIGN.margins.page
          },
          bufferPages: true,
          info: {
            Title: request.metadata?.title || `Document ${request.id}`,
            Author: request.metadata?.author || this.COMPANY_BRANDING.companyName,
            Subject: request.metadata?.subject || 'Official Document',
            Creator: this.COMPANY_BRANDING.companyName,
            Producer: 'Scrubbe PDF Generator v2.0',
            CreationDate: new Date(),
            ModDate: new Date()
          }
        });

        const buffers: Buffer[] = [];
        
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Add legacy content
        this.addProfessionalContent(doc, request);
        
        doc.end();

      } catch (error: any) {
        ErrorUtil.logError('PdfService.generatePdf', error);
        reject(new Error(`PDF generation failed: ${error.message}`));
      }
    });
  }

  /**
   * Legacy method for non-incident documents
   */
  private static addProfessionalContent(
    doc: PDFKit.PDFDocument, 
    request: PdfGenerationRequest
  ): void {
    const { id, description, metadata = {} } = request;
    const pageWidth = doc.page.width - (this.DESIGN.margins.page * 2);
    
    // Add original content structure
    this.addProfessionalHeader(doc, pageWidth);
    this.addDocumentTitle(doc, metadata, pageWidth);
    this.addEnhancedMetadata(doc, id, metadata, pageWidth);
    this.addMainContent(doc, description, pageWidth);
  }

  /**
   * Add professional header with company branding (legacy)
   */
  private static addProfessionalHeader(doc: PDFKit.PDFDocument, pageWidth: number): void {
    const headerHeight = 80;
    const startY = doc.y;

    doc.fillColor(this.DESIGN.colors.primary)
       .rect(this.DESIGN.margins.page, startY, pageWidth, headerHeight)
       .fill();

    doc.fillColor('white')
       .fontSize(this.DESIGN.fonts.heading)
       .font('Helvetica-Bold')
       .text(this.COMPANY_BRANDING.companyName, 
             this.DESIGN.margins.content, 
             startY + 15, 
             { width: pageWidth - 40, align: 'left' });

    doc.fontSize(this.DESIGN.fonts.small)
       .font('Helvetica')
       .fillColor('#e2e8f0')
       .text(this.COMPANY_BRANDING.address, 
             this.DESIGN.margins.content, 
             startY + 35, 
             { width: pageWidth - 40, align: 'left' });

    doc.text(`${this.COMPANY_BRANDING.phone} | ${this.COMPANY_BRANDING.email}`, 
             this.DESIGN.margins.content, 
             startY + 50, 
             { width: pageWidth - 40, align: 'left' });

    doc.y = startY + headerHeight + this.DESIGN.spacing.section;
  }

  /**
   * Add document title with professional styling (legacy)
   */
  private static addDocumentTitle(
    doc: PDFKit.PDFDocument, 
    metadata: any, 
    pageWidth: number
  ): void {
    const title = metadata.title || 'Official Document';
    
    doc.fontSize(this.DESIGN.fonts.title)
       .font('Helvetica-Bold')
       .fillColor(this.DESIGN.colors.primary)
       .text(title, 
             this.DESIGN.margins.content, 
             doc.y, 
             { width: pageWidth - 40, align: 'center' });

    const titleY = doc.y + this.DESIGN.spacing.tight;
    doc.strokeColor(this.DESIGN.colors.accent)
       .lineWidth(2)
       .moveTo(this.DESIGN.margins.content + (pageWidth - 40) * 0.25, titleY)
       .lineTo(this.DESIGN.margins.content + (pageWidth - 40) * 0.75, titleY)
       .stroke();

    doc.y = titleY + this.DESIGN.spacing.section;
  }

  /**
   * Add enhanced metadata section (legacy)
   */
  private static addEnhancedMetadata(
    doc: PDFKit.PDFDocument, 
    id: string, 
    metadata: any, 
    pageWidth: number
  ): void {
    const boxHeight = 100;
    const startY = doc.y;
    const contentWidth = pageWidth - 40;
    const boxX = this.DESIGN.margins.content;

    doc.fillColor(this.DESIGN.colors.lightGray)
       .rect(boxX, startY, contentWidth, boxHeight)
       .fill();

    doc.strokeColor(this.DESIGN.colors.borderGray)
       .lineWidth(1)
       .rect(boxX, startY, contentWidth, boxHeight)
       .stroke();

    doc.fillColor(this.DESIGN.colors.accent)
       .rect(boxX + 1, startY + 1, contentWidth - 2, 25)
       .fill();

    doc.fillColor('white')
       .fontSize(this.DESIGN.fonts.subheading)
       .font('Helvetica-Bold')
       .text('Document Information', boxX + 15, startY + 8);

    const leftX = boxX + 20;
    const rightX = boxX + (contentWidth / 2) + 10;
    const contentY = startY + 40;
    const lineHeight = 18;

    this.addMetadataField(doc, 'Document ID:', id, leftX, contentY);
    this.addMetadataField(doc, 'Author:', metadata.author || 'System Generated', leftX, contentY + lineHeight);
    this.addMetadataField(doc, 'Department:', metadata.department || 'General', rightX, contentY);
    this.addMetadataField(doc, 'Generated:', new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), rightX, contentY + lineHeight);

    doc.fillColor(this.DESIGN.colors.accent)
       .circle(boxX + contentWidth - 30, startY + 15, 3)
       .fill();
    
    doc.fillColor('white')
       .fontSize(this.DESIGN.fonts.micro)
       .text('ACTIVE', boxX + contentWidth - 50, startY + 12);

    doc.y = startY + boxHeight + this.DESIGN.spacing.section;
  }

  /**
   * Helper method to add metadata fields consistently (legacy)
   */
  private static addMetadataField(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number
  ): void {
    doc.fontSize(this.DESIGN.fonts.small)
       .font('Helvetica-Bold')
       .fillColor(this.DESIGN.colors.secondary)
       .text(label, x, y, { continued: true, width: 80 });

    doc.font('Helvetica')
       .fillColor(this.DESIGN.colors.text)
       .text(' ' + value, { width: 120 });
  }

  /**
   * Add main content with proper typography (legacy)
   */
  private static addMainContent(
    doc: PDFKit.PDFDocument, 
    description: string, 
    pageWidth: number
  ): void {
    this.checkPageBreak(doc, 80);
    
    doc.fontSize(this.DESIGN.fonts.heading)
       .font('Helvetica-Bold')
       .fillColor(this.DESIGN.colors.primary)
       .text('Document Content', 
             this.DESIGN.margins.content, 
             doc.y, 
             { width: pageWidth - 40 });

    const lineY = doc.y + this.DESIGN.spacing.micro;
    doc.strokeColor(this.DESIGN.colors.accent)
       .lineWidth(3)
       .moveTo(this.DESIGN.margins.content, lineY)
       .lineTo(this.DESIGN.margins.content + 100, lineY)
       .stroke();

    doc.y = lineY + this.DESIGN.spacing.subsection;

    doc.fontSize(this.DESIGN.fonts.body)
       .font('Helvetica')
       .fillColor(this.DESIGN.colors.text)
       .text(description || 'No content available', 
             this.DESIGN.margins.content, 
             doc.y, {
               width: pageWidth - 40,
               align: 'justify',
               lineGap: 4,
               paragraphGap: this.DESIGN.spacing.line
             });

    doc.y += this.DESIGN.spacing.section;
  }
}