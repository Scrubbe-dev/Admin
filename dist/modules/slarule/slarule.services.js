"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLAService = void 0;
const client_1 = require("@prisma/client");
const slarule_utils_1 = require("./slarule.utils");
const prisma = new client_1.PrismaClient();
class SLAService {
    // Set SLA deadlines when incident is created
    async setSLADeadlines(incidentId, severity) {
        const incident = await prisma.incidentTicket.findUnique({
            where: { id: incidentId }
        });
        if (!incident)
            throw new Error('Incident not found');
        const deadlines = (0, slarule_utils_1.calculateSLADeadlines)(severity, incident.createdAt);
        await prisma.incidentTicket.update({
            where: { id: incidentId },
            data: {
                slaTargetAck: deadlines.respondBy,
                slaTargetResolve: deadlines.resolveBy
            }
        });
    }
    // Check for SLA breaches
    async checkSLABreaches() {
        const now = new Date();
        // Find incidents with response SLA breaches
        const responseBreaches = await prisma.incidentTicket.findMany({
            where: {
                slaTargetAck: { lt: now },
                AND: [{ firstAcknowledgedAt: null }, { slaBreachType: null }]
            }
        });
        // Find incidents with resolution SLA breaches
        const resolutionBreaches = await prisma.incidentTicket.findMany({
            where: {
                slaTargetResolve: { lt: now },
                AND: [{ resolvedAt: null }, { slaBreachType: null }]
            }
        });
        const breaches = [];
        // Process response breaches
        for (const incident of responseBreaches) {
            const duration = Math.round((now.getTime() - incident.slaTargetAck.getTime()) / 60000);
            breaches.push({
                incidentId: incident.id,
                slaType: 'mttr_ack',
                breachedAt: now,
                durationMinutes: duration
            });
            // Mark breach in database
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: { slaBreachType: client_1.SLABreachType.ACK }
            });
        }
        // Process resolution breaches
        for (const incident of resolutionBreaches) {
            const duration = Math.round((now.getTime() - incident.slaTargetResolve.getTime()) / 60000);
            breaches.push({
                incidentId: incident.id,
                slaType: 'mttr_resolve',
                breachedAt: now,
                durationMinutes: duration
            });
            // Mark breach in database
            await prisma.incidentTicket.update({
                where: { id: incident.id },
                data: { slaBreachType: client_1.SLABreachType.RESOLVE }
            });
        }
        return breaches;
    }
    // Send near-breach notifications
    async sendNearBreachNotifications(minutesBefore = 5) {
        const now = new Date();
        // Response near-breaches
        const responseNearBreaches = await prisma.incidentTicket.findMany({
            where: {
                // slaTargetAck: { gt: now },
                slaTargetAck: { lte: new Date(now.getTime() + minutesBefore * 60000) },
                AND: [{ firstAcknowledgedAt: null }, { slaBreachType: null }]
            }
        });
        // Resolution near-breaches
        // const resolutionNearBreaches = await prisma.incidentTicket.findMany({
        //   where: {
        //     slaTargetResolve: { gt: now },
        //     slaTargetResolve: { lte: new Date(now.getTime() + minutesBefore * 60000) },
        //     AND: [{ resolvedAt: null }, { slaBreachType: null },{ lte: new Date(now.getTime() + minutesBefore * 60000) }]
        //   }
        // });
        const resolutionNearBreaches = await prisma.incidentTicket.findMany({
            where: {
                AND: [
                    {
                        slaTargetResolve: {
                            gt: now,
                            lte: new Date(now.getTime() + minutesBefore * 60000)
                        }
                    },
                    { resolvedAt: null },
                    { slaBreachType: null }
                ]
            }
        });
        // In real implementation, integrate with notification service
        console.log(`Sending notifications for ${responseNearBreaches.length} response near-breaches`);
        console.log(`Sending notifications for ${resolutionNearBreaches.length} resolution near-breaches`);
    }
}
exports.SLAService = SLAService;
