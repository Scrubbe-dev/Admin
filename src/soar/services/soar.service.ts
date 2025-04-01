// src/services/soar.service.ts
import { prisma } from '../prisma';
import { Incident, Priority, IncidentStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { PlaybookEngine } from '../utils/playbook.engine';
import { EmailService } from './email.service';

export class SoarService {
  private emailService = new EmailService();
  private playbookEngine = new PlaybookEngine();

  async createIncident(data: {
    title: string;
    description: string;
    alertIds?: string[];
    customerId?: string;
    priority?: Priority;
  }): Promise<Incident> {
    return prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority || Priority.MEDIUM,
          customerId: data.customerId,
        },
      });

      if (data.alertIds) {
        await tx.alert.updateMany({
          where: { id: { in: data.alertIds } },
          data: { incidents: { connect: { id: incident.id } } },
        });
      }

      // Trigger playbook execution
      this.playbookEngine
        .executeForIncident(incident.id)
        .catch((error) => logger.error('Playbook execution failed', error));

      // Notify stakeholders
      this.emailService.sendIncidentNotification(incident).catch((error) => 
        logger.error('Email notification failed', error)
      );

      return incident;
    });
  }

  async updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
    return prisma.incident.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  async executePlaybook(incidentId: string): Promise<void> {
    const incident = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
      include: { alerts: { include: { rule: true } } },
    });

    const context = await this.buildPlaybookContext(incident);
    await this.playbookEngine.execute('default', context);
  }

  private async buildPlaybookContext(incident: Incident) {
    // Complex context building logic
    return {
      incident,
      relatedEvents: await prisma.securityEvent.findMany({
        where: { alert: { incidents: { some: { id: incident.id } } } },
      }),
      customer: incident.customerId ? await prisma.customer.findUnique({
        where: { id: incident.customerId },
      }) : null,
    };
  }
}