import { Request, Response } from 'express';
import { SLAService } from './slarule.services';
import { formatTimeRemaining } from './slarule.utils';
import prisma from '../../lib/prisma';

const slaService = new SLAService();

export class SLAController {
  // Initialize SLA for new incident
  async initializeSLA(req: Request, res: Response): Promise<void> {
    try {
      const { incidentId, severity } = req.body;
      
      await slaService.setSLADeadlines(incidentId, severity);
      
      res.status(200).json({ 
        message: 'SLA initialized successfully',
        success: true 
      });
    } catch (error:any) {
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
    } catch (error:any) {
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
        where: { id: incidentId }
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

      res.status(200).json({
        incidentId,
        response: {
          deadline: incident.slaTargetAck?.toISOString(),
          status: responseStatus,
          timeLeft: formatTimeRemaining(incident.slaTargetAck!)
        },
        resolution: {
          deadline: incident.slaTargetResolve?.toISOString(),
          status: resolutionStatus,
          timeLeft: formatTimeRemaining(incident.slaTargetResolve!)
        }
      });
    } catch (error:any) {
      res.status(500).json({ 
        message: 'Failed to get SLA status',
        error: error.message 
      });
    }
  }
}