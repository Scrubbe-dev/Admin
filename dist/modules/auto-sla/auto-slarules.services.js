"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLAService = void 0;
const client_1 = require("@prisma/client");
const auto_slarules_utils_1 = require("./auto-slarules.utils");
const resend_no_nodemailer_factory_1 = require("../auth/services/resend-no-nodemailer.factory");
// import { createEmailService } from '../auth/services/nodemailer.factory';
const prisma = new client_1.PrismaClient();
class SLAService {
    emailService;
    constructor() {
        this.emailService = (0, resend_no_nodemailer_factory_1.createEmailServiceWithResend)();
    }
    async initializeSLAForNewIncidents() {
        const newIncidents = await prisma.incidentTicket.findMany({
            where: {
                OR: [
                    { slaTargetAck: null },
                    { slaTargetResolve: null },
                    { slaSeverity: null }
                ],
                status: {
                    in: ['OPEN', 'IN_PROGRESS', 'ACKNOWLEDGED', 'INVESTIGATION']
                }
            },
            include: {
                assignedTo: true,
                assignedBy: true,
                createdBy: true
            }
        });
        let initializedCount = 0;
        for (const incident of newIncidents) {
            // Determine severity based on priority if not set
            const severity = this.determineSeverityFromPriority(incident.priority);
            try {
                await this.setSLADeadlines(incident.id, severity);
                initializedCount++;
                console.log(`SLA initialized for incident ${incident.ticketId} with severity ${severity}`);
            }
            catch (error) {
                console.error(`Failed to initialize SLA for incident ${incident.ticketId}:`, error);
            }
        }
        return initializedCount;
    }
    // Set SLA deadlines when incident is created
    async setSLADeadlines(incidentId, severity) {
        const incident = await prisma.incidentTicket.findUnique({
            where: { id: incidentId },
            include: {
                assignedTo: true,
                assignedBy: true,
                createdBy: true
            }
        });
        if (!incident)
            throw new Error('Incident not found');
        const slaRule = (0, auto_slarules_utils_1.getSLARule)(severity);
        const deadlines = (0, auto_slarules_utils_1.calculateSLADeadlines)(severity, incident.createdAt);
        await prisma.incidentTicket.update({
            where: { id: incidentId },
            data: {
                slaTargetAck: deadlines.respondBy,
                slaTargetResolve: deadlines.resolveBy,
                slaSeverity: severity,
                slaResponseTimeMinutes: slaRule.responseTimeMinutes,
                slaResolveTimeMinutes: slaRule.resolveTimeMinutes,
                slaResponseHalfNotified: false,
                slaResolveHalfNotified: false,
                slaResponseBreachNotified: false,
                slaResolveBreachNotified: false,
                // Set MTTR fields
                mttrTargetAck: deadlines.respondBy,
                mttrTargetResolve: deadlines.resolveBy,
                mttrResponseHalfNotified: false,
                mttrResolveHalfNotified: false,
                mttrResponseBreachNotified: false,
                mttrResolveBreachNotified: false
            }
        });
    }
    // Check for SLA breaches and send notifications
    async checkSLABreaches() {
        const now = new Date();
        const breaches = [];
        // Get all active incidents that need SLA monitoring
        const activeIncidents = await prisma.incidentTicket.findMany({
            where: {
                status: { in: ['OPEN', 'IN_PROGRESS', 'ACKNOWLEDGED', 'INVESTIGATION'] },
                slaTargetAck: { not: null },
                slaTargetResolve: { not: null }
            },
            include: {
                assignedTo: true,
                assignedBy: true,
                createdBy: true
            }
        });
        for (const incident of activeIncidents) {
            if (!incident.slaTargetAck || !incident.slaTargetResolve)
                continue;
            const slaRule = (0, auto_slarules_utils_1.getSLARule)(incident.slaSeverity || 'medium');
            // Check response time milestones
            await this.checkResponseTimeMilestones(incident, slaRule, now, breaches);
            // Check resolve time milestones
            await this.checkResolveTimeMilestones(incident, slaRule, now, breaches);
            // Check MTTR response time milestones
            await this.checkMTTRResponseTimeMilestones(incident, slaRule, now, breaches);
            // Check MTTR resolve time milestones
            await this.checkMTTRResolveTimeMilestones(incident, slaRule, now, breaches);
        }
        return breaches;
    }
    determineSeverityFromPriority(priority) {
        const priorityMap = {
            'CRITICAL': 'critical',
            'HIGH': 'high',
            'MEDIUM': 'medium',
            'LOW': 'low',
            'URGENT': 'critical',
            'NORMAL': 'medium',
            'MINOR': 'low'
        };
        return priorityMap[priority.toUpperCase()] || 'medium';
    }
    // Set SLA deadlines when incident is created
    //   async setSLADeadlines(incidentId: string, severity: string): Promise<void> {
    //     const incident = await prisma.incidentTicket.findUnique({
    //       where: { id: incidentId },
    //       include: { 
    //         assignedTo: true,
    //         assignedBy: true,
    //         createdBy: true // Added to include ticket creator
    //       }
    //     });
    //     if (!incident) throw new Error('Incident not found');
    //     const slaRule = getSLARule(severity);
    //     const deadlines = calculateSLADeadlines(severity, incident.createdAt);
    //     await prisma.incidentTicket.update({
    //       where: { id: incidentId },
    //       data: {
    //         slaTargetAck: deadlines.respondBy,
    //         slaTargetResolve: deadlines.resolveBy,
    //         slaSeverity: severity,
    //         slaResponseTimeMinutes: slaRule.responseTimeMinutes,
    //         slaResolveTimeMinutes: slaRule.resolveTimeMinutes,
    //         slaResponseHalfNotified: false,
    //         slaResolveHalfNotified: false,
    //         slaResponseBreachNotified: false,
    //         slaResolveBreachNotified: false,
    //         // Set MTTR fields
    //         mttrTargetAck: deadlines.respondBy,
    //         mttrTargetResolve: deadlines.resolveBy,
    //         mttrResponseHalfNotified: false,
    //         mttrResolveHalfNotified: false,
    //         mttrResponseBreachNotified: false,
    //         mttrResolveBreachNotified: false
    //       }
    //     });
    //   }
    //   // Check for SLA breaches and send notifications
    //   async checkSLABreaches(): Promise<SLABreach[]> {
    //     const now = new Date();
    //     const breaches: SLABreach[] = [];
    //     // Get all active incidents that need SLA monitoring
    //     const activeIncidents = await prisma.incidentTicket.findMany({
    //       where: {
    //         status: { in: ['OPEN', 'IN_PROGRESS', 'ACKNOWLEDGED', 'INVESTIGATION'] },
    //         slaTargetAck: { not: null },
    //         slaTargetResolve: { not: null }
    //       },
    //       include: {
    //         assignedTo: true,
    //         assignedBy: true,
    //         createdBy: true // Added to include ticket creator
    //       }
    //     });
    //     for (const incident of activeIncidents) {
    //       if (!incident.slaTargetAck || !incident.slaTargetResolve) continue;
    //       const slaRule = getSLARule(incident.slaSeverity || 'medium');
    //       // Check response time milestones
    //       await this.checkResponseTimeMilestones(incident, slaRule, now, breaches);
    //       // Check resolve time milestones
    //       await this.checkResolveTimeMilestones(incident, slaRule, now, breaches);
    //       // Check MTTR response time milestones
    //       await this.checkMTTRResponseTimeMilestones(incident, slaRule, now, breaches);
    //       // Check MTTR resolve time milestones
    //       await this.checkMTTRResolveTimeMilestones(incident, slaRule, now, breaches);
    //     }
    //     return breaches;
    //   }
    async checkResponseTimeMilestones(incident, slaRule, now, breaches) {
        if (incident.firstAcknowledgedAt)
            return; // Already acknowledged
        const responseDeadline = incident.slaTargetAck;
        const halfResponseTime = slaRule.responseTimeMinutes / 2;
        const halfResponseDeadline = new Date(incident.createdAt.getTime() + halfResponseTime * 60000);
        // Check if half response time has passed
        if (!incident.slaResponseHalfNotified && now >= halfResponseDeadline && now < responseDeadline) {
            await this.sendHalfTimeNotification(incident, 'response', halfResponseTime);
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: { slaResponseHalfNotified: true }
            });
        }
        // Check if response deadline has passed
        if (!incident.slaResponseBreachNotified && now >= responseDeadline) {
            const duration = Math.round((now.getTime() - responseDeadline.getTime()) / 60000);
            breaches.push({
                incidentId: incident.id,
                slaType: 'mttr_ack',
                breachedAt: now,
                durationMinutes: duration
            });
            await this.sendBreachNotification(incident, 'response', duration);
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: {
                    slaResponseBreachNotified: true,
                    slaBreachType: client_1.SLABreachType.ACK
                }
            });
        }
    }
    async checkResolveTimeMilestones(incident, slaRule, now, breaches) {
        if (incident.resolvedAt)
            return; // Already resolved
        const resolveDeadline = incident.slaTargetResolve;
        const halfResolveTime = slaRule.resolveTimeMinutes / 2;
        const halfResolveDeadline = new Date(incident.createdAt.getTime() + halfResolveTime * 60000);
        // Check if half resolve time has passed
        if (!incident.slaResolveHalfNotified && now >= halfResolveDeadline && now < resolveDeadline) {
            await this.sendHalfTimeNotification(incident, 'resolution', halfResolveTime);
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: { slaResolveHalfNotified: true }
            });
        }
        // Check if resolve deadline has passed
        if (!incident.slaResolveBreachNotified && now >= resolveDeadline) {
            const duration = Math.round((now.getTime() - resolveDeadline.getTime()) / 60000);
            breaches.push({
                incidentId: incident.id,
                slaType: 'mttr_resolve',
                breachedAt: now,
                durationMinutes: duration
            });
            await this.sendBreachNotification(incident, 'resolution', duration);
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: {
                    slaResolveBreachNotified: true,
                    slaBreachType: client_1.SLABreachType.RESOLVE
                }
            });
        }
    }
    // New method to check MTTR response time milestones
    async checkMTTRResponseTimeMilestones(incident, slaRule, now, breaches) {
        if (incident.firstAcknowledgedAt)
            return; // Already acknowledged
        const responseDeadline = incident.mttrTargetAck || incident.slaTargetAck;
        const halfResponseTime = slaRule.responseTimeMinutes / 2;
        const halfResponseDeadline = new Date(incident.createdAt.getTime() + halfResponseTime * 60000);
        // Check if half MTTR response time has passed
        if (!incident.mttrResponseHalfNotified && now >= halfResponseDeadline && now < responseDeadline) {
            await this.sendHalfTimeNotification(incident, 'mttr_response', halfResponseTime);
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: { mttrResponseHalfNotified: true }
            });
        }
        // Check if MTTR response deadline has passed
        if (!incident.mttrResponseBreachNotified && now >= responseDeadline) {
            const duration = Math.round((now.getTime() - responseDeadline.getTime()) / 60000);
            breaches.push({
                incidentId: incident.id,
                slaType: 'mttr_ack',
                breachedAt: now,
                durationMinutes: duration
            });
            await this.sendBreachNotification(incident, 'mttr_response', duration);
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: {
                    mttrResponseBreachNotified: true,
                    slaBreachType: client_1.SLABreachType.ACK
                }
            });
        }
    }
    // New method to check MTTR resolve time milestones
    async checkMTTRResolveTimeMilestones(incident, slaRule, now, breaches) {
        if (incident.resolvedAt)
            return; // Already resolved
        const resolveDeadline = incident.mttrTargetResolve || incident.slaTargetResolve;
        const halfResolveTime = slaRule.resolveTimeMinutes / 2;
        const halfResolveDeadline = new Date(incident.createdAt.getTime() + halfResolveTime * 60000);
        // Check if half MTTR resolve time has passed
        if (!incident.mttrResolveHalfNotified && now >= halfResolveDeadline && now < resolveDeadline) {
            await this.sendHalfTimeNotification(incident, 'mttr_resolution', halfResolveTime);
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: { mttrResolveHalfNotified: true }
            });
        }
        // Check if MTTR resolve deadline has passed
        if (!incident.mttrResolveBreachNotified && now >= resolveDeadline) {
            const duration = Math.round((now.getTime() - resolveDeadline.getTime()) / 60000);
            breaches.push({
                incidentId: incident.id,
                slaType: 'mttr_resolve',
                breachedAt: now,
                durationMinutes: duration
            });
            await this.sendBreachNotification(incident, 'mttr_resolution', duration);
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: {
                    mttrResolveBreachNotified: true,
                    slaBreachType: client_1.SLABreachType.RESOLVE
                }
            });
        }
    }
    async sendHalfTimeNotification(incident, type, halfTime) {
        // Get both assignee and creator emails
        const emails = [];
        if (incident.assignedTo?.email)
            emails.push(incident.assignedTo.email);
        if (incident.createdBy?.email)
            emails.push(incident.createdBy.email);
        if (incident.assignedBy?.email)
            emails.push(incident.assignedBy.email);
        const uniqueEmails = [...new Set(emails)];
        if (uniqueEmails.length === 0)
            return;
        const timeUnit = halfTime >= 60 ? `${Math.round(halfTime / 60)} hours` : `${halfTime} minutes`;
        let subject, typeText;
        switch (type) {
            case 'response':
                subject = `SLA Alert: Half Response Time Reached`;
                typeText = 'Response';
                break;
            case 'resolution':
                subject = `SLA Alert: Half Resolution Time Reached`;
                typeText = 'Resolution';
                break;
            case 'mttr_response':
                subject = `MTTR Alert: Half Response Time Reached`;
                typeText = 'MTTR Response';
                break;
            case 'mttr_resolution':
                subject = `MTTR Alert: Half Resolution Time Reached`;
                typeText = 'MTTR Resolution';
                break;
        }
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">SLA Time Alert</h2>
        <p>Hello,</p>
        <p>This is to notify you that the incident ticket <strong>#${incident.ticketId}</strong> has reached half of its ${typeText} time.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p><strong>Ticket Details:</strong></p>
          <p><strong>Title:</strong> ${incident.reason}</p>
          <p><strong>Priority:</strong> ${incident.priority}</p>
          <p><strong>${typeText} Time:</strong> ${timeUnit} remaining</p>
          <p><strong>Severity:</strong> ${incident.slaSeverity}</p>
        </div>

        <p>Please take appropriate action to ensure the SLA is met.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || 'Scrubbe'} Team</p>
      </div>
    `;
        try {
            await this.emailService.sendCustomEmail({
                to: uniqueEmails.join(','),
                subject,
                html
            });
            console.log(`Half-time ${type} notification sent for incident ${incident.ticketId}`);
        }
        catch (error) {
            console.error(`Failed to send half-time notification for incident ${incident.ticketId}:`, error);
        }
    }
    async sendBreachNotification(incident, type, breachDuration) {
        // Get both assignee and creator emails
        const emails = [];
        if (incident.assignedTo?.email)
            emails.push(incident.assignedTo.email);
        if (incident.createdBy?.email)
            emails.push(incident.createdBy.email);
        if (incident.assignedBy?.email)
            emails.push(incident.assignedBy.email);
        const uniqueEmails = [...new Set(emails)];
        if (uniqueEmails.length === 0)
            return;
        const durationText = breachDuration >= 60 ?
            `${Math.round(breachDuration / 60)} hours` :
            `${breachDuration} minutes`;
        let subject, typeText;
        switch (type) {
            case 'response':
                subject = `URGENT: SLA Response Breach`;
                typeText = 'Response Time';
                break;
            case 'resolution':
                subject = `URGENT: SLA Resolution Breach`;
                typeText = 'Resolution Time';
                break;
            case 'mttr_response':
                subject = `URGENT: MTTR Response Breach`;
                typeText = 'MTTR Response Time';
                break;
            case 'mttr_resolution':
                subject = `URGENT: MTTR Resolution Breach`;
                typeText = 'MTTR Resolution Time';
                break;
        }
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">SLA BREACH ALERT</h2>
        <p>Hello,</p>
        <p>This is an urgent notification that the incident ticket <strong>#${incident.ticketId}</strong> has breached its ${typeText} SLA.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p><strong>Breach Details:</strong></p>
          <p><strong>Ticket:</strong> #${incident.ticketId}</p>
          <p><strong>Title:</strong> ${incident.reason}</p>
          <p><strong>Priority:</strong> ${incident.priority}</p>
          <p><strong>Breach Duration:</strong> ${durationText}</p>
          <p><strong>Severity:</strong> ${incident.slaSeverity}</p>
          <p><strong>Breach Type:</strong> ${typeText}</p>
        </div>

        <p style="color: #dc3545;"><strong>Immediate action is required to address this breach.</strong></p>
        <p>Thank you,<br>The ${process.env.APP_NAME || 'Scrubbe'} Team</p>
      </div>
    `;
        try {
            await this.emailService.sendCustomEmail({
                to: uniqueEmails.join(','),
                subject,
                html
            });
            console.log(`Breach notification sent for incident ${incident.ticketId}`);
        }
        catch (error) {
            console.error(`Failed to send breach notification for incident ${incident.ticketId}:`, error);
        }
    }
}
exports.SLAService = SLAService;
