import { Request, Response } from 'express';
import { SLAService } from './auto-slarules.services';
import { formatTimeRemaining } from './auto-slarules.utils';
import prisma from '../../lib/prisma';
import { SLACronService } from './auto-cron.service';

const slaService = new SLAService();
const slaCronService = new SLACronService();

export class SLAController {

async triggerAutomaticSLA(req: Request, res: Response): Promise<void> {
    try {
      const result = await slaCronService.manualSLACheck();
      
      res.status(200).json({
        message: 'Automatic SLA check triggered manually',
        success: true,
        result
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: 'Failed to trigger automatic SLA check',
        error: error.message 
      });
    }
  }
  async initializeSLA(req: Request, res: Response): Promise<void> {
    try {
      const { incidentId, severity } = req.body;
      
      if (!incidentId || !severity) {
        res.status(400).json({ 
          message: 'Incident ID and severity are required',
          success: false 
        });
        return;
      }
      
      await slaService.setSLADeadlines(incidentId, severity);
      
      res.status(200).json({ 
        message: 'SLA initialized successfully',
        success: true 
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: 'Failed to initialize SLA',
        error: error.message 
      });
    }
  }

  // Manual SLA breach check
  async checkSLABreaches(req: Request, res: Response): Promise<void> {
    try {
      const breaches = await slaService.checkSLABreaches();
      
      res.status(200).json({
        message: 'SLA breaches checked',
        breaches,
        count: breaches.length
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: 'Failed to check SLA breaches',
        error: error.message 
      });
    }
  }

  // Get SLA status for incident
  async getSLAStatus(req: Request, res: Response): Promise<void> {
    try {
      const { incidentId } = req.params;
      const incident = await prisma.incidentTicket.findUnique({
        where: { id: incidentId },
        include: {
          createdBy: true,
          assignedTo: true,
          assignedBy: true
        }
      });

      if (!incident) {
        res.status(404).json({ message: 'Incident not found' });
        return;
      }

      const now = new Date();
      const responseStatus = incident.firstAcknowledgedAt ? 'met' : 
                            incident.slaTargetAck && incident.slaTargetAck < now ? 'breached' : 'pending';
      
      const resolutionStatus = incident.resolvedAt ? 'met' : 
                              incident.slaTargetResolve && incident.slaTargetResolve < now ? 'breached' : 'pending';

      // Calculate time percentages
      const responseProgress = incident.slaTargetAck ? 
        Math.min(100, Math.max(0, ((now.getTime() - incident.createdAt.getTime()) / 
        (incident.slaTargetAck.getTime() - incident.createdAt.getTime())) * 100)) : 0;

      const resolutionProgress = incident.slaTargetResolve ? 
        Math.min(100, Math.max(0, ((now.getTime() - incident.createdAt.getTime()) / 
        (incident.slaTargetResolve.getTime() - incident.createdAt.getTime())) * 100)) : 0;

      // MTTR status calculations
      const mttrResponseStatus = incident.firstAcknowledgedAt ? 'met' : 
                                incident.mttrTargetAck && incident.mttrTargetAck < now ? 'breached' : 'pending';
      
      const mttrResolutionStatus = incident.resolvedAt ? 'met' : 
                                  incident.mttrTargetResolve && incident.mttrTargetResolve < now ? 'breached' : 'pending';

      const mttrResponseProgress = incident.mttrTargetAck ? 
        Math.min(100, Math.max(0, ((now.getTime() - incident.createdAt.getTime()) / 
        (incident.mttrTargetAck.getTime() - incident.createdAt.getTime())) * 100)) : 0;

      const mttrResolutionProgress = incident.mttrTargetResolve ? 
        Math.min(100, Math.max(0, ((now.getTime() - incident.createdAt.getTime()) / 
        (incident.mttrTargetResolve.getTime() - incident.createdAt.getTime())) * 100)) : 0;

      res.status(200).json({
        incidentId,
        response: {
          deadline: incident.slaTargetAck?.toISOString(),
          status: responseStatus,
          timeLeft: formatTimeRemaining(incident.slaTargetAck!),
          progress: Math.round(responseProgress),
          halfTimeNotified: incident.slaResponseHalfNotified,
          breachNotified: incident.slaResponseBreachNotified
        },
        resolution: {
          deadline: incident.slaTargetResolve?.toISOString(),
          status: resolutionStatus,
          timeLeft: formatTimeRemaining(incident.slaTargetResolve!),
          progress: Math.round(resolutionProgress),
          halfTimeNotified: incident.slaResolveHalfNotified,
          breachNotified: incident.slaResolveBreachNotified
        },
        mttrResponse: {
          deadline: incident.mttrTargetAck?.toISOString(),
          status: mttrResponseStatus,
          timeLeft: formatTimeRemaining(incident.mttrTargetAck!),
          progress: Math.round(mttrResponseProgress),
          halfTimeNotified: incident.mttrResponseHalfNotified,
          breachNotified: incident.mttrResponseBreachNotified
        },
        mttrResolution: {
          deadline: incident.mttrTargetResolve?.toISOString(),
          status: mttrResolutionStatus,
          timeLeft: formatTimeRemaining(incident.mttrTargetResolve!),
          progress: Math.round(mttrResolutionProgress),
          halfTimeNotified: incident.mttrResolveHalfNotified,
          breachNotified: incident.mttrResolveBreachNotified
        }
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: 'Failed to get SLA status',
        error: error.message 
      });
    }
  }

  // Manual trigger for cron job (for testing)
  async triggerSLACheck(req: Request, res: Response): Promise<void> {
    try {
      const result = await slaCronService.manualSLACheck();
      
      res.status(200).json({
        message: 'SLA check triggered manually',
        success: true,
        result
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: 'Failed to trigger SLA check',
        error: error.message 
      });
    }
  }
}