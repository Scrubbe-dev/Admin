import { PrismaClient } from '@prisma/client';
import { SLADeadlines, SLABreach, SLARule } from '../slarule/slarule.types';
import { calculateSLADeadlines, getSLARule } from './auto-slarules.utils';
import { createEmailService } from '../auth/services/nodemailer.factory';

const prisma = new PrismaClient();

export class SLAService {
  private emailService;

  constructor() {
    this.emailService = createEmailService();
  }

  // Set SLA deadlines when incident is created
  async setSLADeadlines(incidentId: string, severity: string): Promise<void> {
    const incident = await prisma.incidentTicket.findUnique({
      where: { id: incidentId },
      include: { assignedTo: true }
    });

    if (!incident) throw new Error('Incident not found');

    const slaRule = getSLARule(severity);
    const deadlines = calculateSLADeadlines(severity, incident.createdAt);

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
        slaResolveBreachNotified: false
      }
    });
  }

  // Check for SLA breaches and send notifications
  async checkSLABreaches(): Promise<SLABreach[]> {
    const now = new Date();
    const breaches: SLABreach[] = [];

    // Get all active incidents that need SLA monitoring
    const activeIncidents = await prisma.incidentTicket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS', 'ACKNOWLEDGED', 'INVESTIGATION'] },
        slaTargetAck: { not: null },
        slaTargetResolve: { not: null }
      },
      include: {
        assignedTo: true,
        assignedBy: true
      }
    });

    for (const incident of activeIncidents) {
      if (!incident.slaTargetAck || !incident.slaTargetResolve) continue;

      const slaRule = getSLARule(incident.slaSeverity || 'medium');
      
      // Check response time milestones
      await this.checkResponseTimeMilestones(incident, slaRule, now, breaches);
      
      // Check resolve time milestones
      await this.checkResolveTimeMilestones(incident, slaRule, now, breaches);
    }

    return breaches;
  }

  private async checkResponseTimeMilestones(
    incident: any,
    slaRule: SLARule,
    now: Date,
    breaches: SLABreach[]
  ): Promise<void> {
    if (incident.firstAcknowledgedAt) return; // Already acknowledged

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
        slaType: 'ack',
        breachedAt: now,
        durationMinutes: duration
      });

      await this.sendBreachNotification(incident, 'response', duration);
      await prisma.incidentTicket.update({
        where: { id: incident.id },
        data: { 
          slaResponseBreachNotified: true,
          slaBreachType: 'ack'
        }
      });
    }
  }

  private async checkResolveTimeMilestones(
    incident: any,
    slaRule: SLARule,
    now: Date,
    breaches: SLABreach[]
  ): Promise<void> {
    if (incident.resolvedAt) return; // Already resolved

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
        slaType: 'resolve',
        breachedAt: now,
        durationMinutes: duration
      });

      await this.sendBreachNotification(incident, 'resolution', duration);
      await prisma.incidentTicket.update({
        where: { id: incident.id },
        data: { 
          slaResolveBreachNotified: true,
          slaBreachType: 'resolve'
        }
      });
    }
  }

  private async sendHalfTimeNotification(
    incident: any, 
    type: 'response' | 'resolution', 
    halfTime: number
  ): Promise<void> {
    const assigneeEmail = incident.assignedTo?.email || incident.assignedBy?.email;
    if (!assigneeEmail) return;

    const timeUnit = halfTime >= 60 ? `${Math.round(halfTime / 60)} hours` : `${halfTime} minutes`;
    const subject = `SLA Alert: Half ${type === 'response' ? 'Response' : 'Resolution'} Time Reached`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">SLA Time Alert</h2>
        <p>Hello,</p>
        <p>This is to notify you that the incident ticket <strong>#${incident.ticketId}</strong> has reached half of its ${type} time.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p><strong>Ticket Details:</strong></p>
          <p><strong>Title:</strong> ${incident.reason}</p>
          <p><strong>Priority:</strong> ${incident.priority}</p>
          <p><strong>${type === 'response' ? 'Response' : 'Resolution'} Time:</strong> ${timeUnit} remaining</p>
          <p><strong>Severity:</strong> ${incident.slaSeverity}</p>
        </div>

        <p>Please take appropriate action to ensure the SLA is met.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || 'Scrubbe'} Team</p>
      </div>
    `;

    try {
      await this.emailService.sendCustomEmail({
        to: assigneeEmail,
        subject,
        html
      });
      console.log(`Half-time ${type} notification sent for incident ${incident.ticketId}`);
    } catch (error) {
      console.error(`Failed to send half-time notification for incident ${incident.ticketId}:`, error);
    }
  }

  private async sendBreachNotification(
    incident: any, 
    type: 'response' | 'resolution', 
    breachDuration: number
  ): Promise<void> {
    const assigneeEmail = incident.assignedTo?.email || incident.assignedBy?.email;
    if (!assigneeEmail) return;

    const durationText = breachDuration >= 60 ? 
      `${Math.round(breachDuration / 60)} hours` : 
      `${breachDuration} minutes`;

    const subject = `URGENT: SLA ${type === 'response' ? 'Response' : 'Resolution'} Breach`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">SLA BREACH ALERT</h2>
        <p>Hello,</p>
        <p>This is an urgent notification that the incident ticket <strong>#${incident.ticketId}</strong> has breached its ${type} SLA.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p><strong>Breach Details:</strong></p>
          <p><strong>Ticket:</strong> #${incident.ticketId}</p>
          <p><strong>Title:</strong> ${incident.reason}</p>
          <p><strong>Priority:</strong> ${incident.priority}</p>
          <p><strong>Breach Duration:</strong> ${durationText}</p>
          <p><strong>Severity:</strong> ${incident.slaSeverity}</p>
          <p><strong>Breach Type:</strong> ${type === 'response' ? 'Response Time' : 'Resolution Time'}</p>
        </div>

        <p style="color: #dc3545;"><strong>Immediate action is required to address this breach.</strong></p>
        <p>Thank you,<br>The ${process.env.APP_NAME || 'Scrubbe'} Team</p>
      </div>
    `;

    try {
      await this.emailService.sendCustomEmail({
        to: assigneeEmail,
        subject,
        html
      });
      console.log(`Breach notification sent for incident ${incident.ticketId}`);
    } catch (error) {
      console.error(`Failed to send breach notification for incident ${incident.ticketId}:`, error);
    }
  }
}