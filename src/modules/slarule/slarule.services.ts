import { PrismaClient } from '@prisma/client';
import { SLADeadlines, SLABreach } from './slarule.types';
import { calculateSLADeadlines } from './slarule.utils';

const prisma = new PrismaClient();

export class SLAService {
  // Set SLA deadlines when incident is created
  async setSLADeadlines(incidentId: string, severity: string): Promise<void> {
    const incident = await prisma.incidentTicket.findUnique({
      where: { id: incidentId }
    });

    if (!incident) throw new Error('Incident not found');

    const deadlines = calculateSLADeadlines(severity, incident.createdAt);

    await prisma.incidentTicket.update({
      where: { id: incidentId },
      data: {
        slaTargetAck: deadlines.respondBy,
        slaTargetResolve: deadlines.resolveBy
      }
    });
  }

  // Check for SLA breaches
  async checkSLABreaches(): Promise<SLABreach[]> {
    const now = new Date();
    
    // Find incidents with response SLA breaches
    // const responseBreaches = await prisma.incidentTicket.findMany({
    //   where: {
    //     slaTargetAck: { lt: now },
    //     AND: [{ firstAcknowledgedAt: null }, { slaBreachType: null }]
    //   }
    // });

    // Find incidents with resolution SLA breaches
    // const resolutionBreaches = await prisma.incidentTicket.findMany({
    //   where: {
    //     slaTargetResolve: { lt: now },
    //     AND: [{ resolvedAt: null }, { slaBreachType: null }]
    //   }
    // });

    const breaches: SLABreach[] = [];

    // Process response breaches
    // for (const incident of responseBreaches) {
    //   const duration = Math.round(
    //     (now.getTime() - incident.slaTargetAck!.getTime()) / 60000
    //   );
      
    //   breaches.push({
    //     incidentId: incident.id,
    //     slaType: 'ack',
    //     breachedAt: now,
    //     durationMinutes: duration
    //   });

    //   // Mark breach in database
    //   // await prisma.incidentTicket.update({
    //   //   where: { id: incident.id },
    //   //   data: { slaBreachType: 'ack' }
    //   // });
    // }

    // Process resolution breaches
    // for (const incident of resolutionBreaches) {
    //   const duration = Math.round(
    //     (now.getTime() - incident.slaTargetResolve!.getTime()) / 60000
    //   );
      
    //   breaches.push({
    //     incidentId: incident.id,
    //     slaType: 'resolve',
    //     breachedAt: now,
    //     durationMinutes: duration
    //   });

    //   // Mark breach in database
    //   // await prisma.incidentTicket.update({
    //   //   where: { id: incident.id },
    //   //   data: { slaBreachType: 'resolve' }
    //   // });
    // }

    return breaches;
  }

  // Send near-breach notifications
  async sendNearBreachNotifications(minutesBefore: number = 5): Promise<void> {
    const now = new Date();
    
    // Response near-breaches
    // const responseNearBreaches = await prisma.incidentTicket.findMany({
    //   where: {
    //     slaTargetAck: { gt: now },
    //     slaTargetAck: { lte: new Date(now.getTime() + minutesBefore * 60000) },
    //     AND: [{ firstAcknowledgedAt: null }, { slaBreachType: null }]
    //   }
    // });

    // Resolution near-breaches
    // const resolutionNearBreaches = await prisma.incidentTicket.findMany({
    //   where: {
    //     slaTargetResolve: { gt: now },
    //     slaTargetResolve: { lte: new Date(now.getTime() + minutesBefore * 60000) },
    //     AND: [{ resolvedAt: null }, { slaBreachType: null }]
    //   }
    // });

    // In real implementation, integrate with notification service
    // console.log(`Sending notifications for ${responseNearBreaches.length} response near-breaches`);
    // console.log(`Sending notifications for ${resolutionNearBreaches.length} resolution near-breaches`);
  }
}