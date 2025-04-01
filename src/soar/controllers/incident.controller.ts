// src/controllers/soar/incident.controller.ts
import { Request, Response } from 'express';
import { SoarService } from '../services/soar.service';
// import { validate } from '../middleware/validation';
import { z } from 'zod';

const createIncidentSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10),
  alertIds: z.array(z.string().uuid()).optional(),
  customerId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export class IncidentController {
  private soarService = new SoarService();

//   @validate(createIncidentSchema)
  async createIncident(req: Request, res: Response) {
    const incident = await this.soarService.createIncident(req.body);
    res.status(201).json(incident);
  }

  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    const incident = await this.soarService.updateIncidentStatus(id, status);
    res.json(incident);
  }

  async executePlaybook(req: Request, res: Response) {
    const { id } = req.params;
    await this.soarService.executePlaybook(id);
    res.status(202).json({ accepted: true });
  }
}