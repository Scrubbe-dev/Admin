import prisma from '../../../prisma-clients/client';
import { 
  DashboardData, 
  DashboardFilters, 
  SLABreach, 
  SystemHealth, 
  PostmortemSummary, 
  AutomationRun 
} from '../utils/dashboard.types';
import { DashboardUtils } from '../utils/dashboard.utils';

export class DashboardService {
  async getDashboardData(businessId: string, filters: DashboardFilters = {} ): Promise<DashboardData> {
    try {
      const whereClause = DashboardUtils.buildWhereClause(filters);
      whereClause.businessId = businessId;

      // Fetch incidents with related data
      const incidents = await prisma.incidentTicket.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          comments: true,
          ResolveIncident: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Fetch recent postmortems
      const recentPostmortems = await prisma.resolveIncident.findMany({
        where: {
          incidentTicket: {
            businessId,
          },
        },
        include: {
          incidentTicket: {
            select: {
              ticketId: true,
              reason: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });

      // Get on-call engineer
      const onCallEngineer = await this.getCurrentOnCallEngineer(businessId);

      // Calculate metrics
      const metrics = {
        openIncidents: incidents.filter(inc => inc.status === 'OPEN').length,
        mtta: DashboardUtils.calculateMTTA(incidents),
        mttr: DashboardUtils.calculateMTTR(incidents),
        slaCompliance: DashboardUtils.calculateSLACompliance(incidents),
      };

      // Generate trends and analytics
      const incidentTrends = DashboardUtils.generateIncidentTrends(incidents);
      const recurringIssues = DashboardUtils.identifyRecurringIssues(incidents);
      
      // Get team members for workload calculation
      const teamMembers = await prisma.user.findMany({
        where: { businessId },
        select: { email: true, firstName: true, lastName: true },
      });
      
      const teamWorkload = DashboardUtils.calculateTeamWorkload(incidents, teamMembers);
      const slaBreaches = await this.getSLABreaches(businessId);
      const systemHealth = await this.getSystemHealth(businessId);
      const automationRuns = await this.getAutomationRuns(businessId);
      const activeIncidents = this.getActiveIncidents(incidents);

      return {
        metrics,
        incidentTrends,
        recurringIssues,
        teamWorkload,
        slaBreaches,
        systemHealth,
        recentPostmortems: recentPostmortems.map(pm => ({
          id: pm.id,
          title: pm.knowledgeTitleInternal,
          createdAt: pm.createdAt,
          incidentId: pm.incidentTicket.ticketId,
        })),
        automationRuns,
        activeIncidents,
        onCallEngineer,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getCurrentOnCallEngineer(businessId: string) {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const onCallAssignment = await prisma.onCallAssignment.findFirst({
      where: {
        date: new Date(today),
        status: 'ACTIVE',
        teamMembers: {
          some: {
            member: {
              businessId,
            },
          },
        },
      },
      include: {
        teamMembers: {
          include: {
            member: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!onCallAssignment) {
      return {
        name: 'Not Assigned',
        email: '',
        shiftEnd: new Date(),
      };
    }

    const currentMember = onCallAssignment.teamMembers.find(tm => {
      return currentTime >= tm.startTime && currentTime <= tm.endTime;
    });

    if (!currentMember) {
      return {
        name: 'Shift Change',
        email: '',
        shiftEnd: new Date(),
      };
    }

    return {
      name: `${currentMember.member.firstName} ${currentMember.member.lastName}`,
      email: currentMember.member.email,
      shiftEnd: new Date(`${today}T${currentMember.endTime}`),
    };
  }

  private async getSLABreaches(businessId: string): Promise<SLABreach[]> {
    const atRiskIncidents = await prisma.incidentTicket.findMany({
      where: {
        businessId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'ACKNOWLEDGED'] },
        slaTargetResolve: { not: null },
      },
      select: {
        id: true,
        ticketId: true,
        reason: true,
        slaTargetResolve: true,
        priority: true,
      },
    });

    const now = new Date();
    return atRiskIncidents
      .filter(incident => incident.slaTargetResolve)
      .map(incident => {
        const timeToBreach = Math.max(
          0,
          Math.round((incident.slaTargetResolve!.getTime() - now.getTime()) / (1000 * 60))
        );
        
        return {
          incidentId: incident.ticketId,
          title: incident.reason,
          timeToBreach,
          breachType: 'RESOLVE' as const,
        };
      })
      .filter(breach => breach.timeToBreach <= 120) // Only show incidents with <= 2 hours to breach
      .sort((a, b) => a.timeToBreach - b.timeToBreach)
      .slice(0, 5);
  }

  private async getSystemHealth(businessId: string): Promise<SystemHealth[]> {
    // This would integrate with your actual system health monitoring
    // For now, returning mock data based on recent incidents
    const recentIncidents = await prisma.incidentTicket.groupBy({
      by: ['category'],
      where: {
        businessId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        priority: { in: ['HIGH', 'CRITICAL'] },
      },
      _count: {
        id: true,
      },
    });

    const systemHealth: SystemHealth[] = [
      { component: 'API', status: 'healthy', message: 'All systems operational' },
      { component: 'Database', status: 'healthy', message: 'Performance normal' },
      { component: 'Payment Gateway', status: 'healthy', message: 'Transactions processing' },
      { component: 'Network', status: 'healthy', message: 'Latency within thresholds' },
    ];

    // Update status based on recent incidents
    recentIncidents.forEach(incidentGroup => {
      const component = systemHealth.find(sh => 
        sh.component.toLowerCase().includes(incidentGroup.category.toLowerCase()) ||
        incidentGroup.category.toLowerCase().includes(sh.component.toLowerCase())
      );
      
      if (component && incidentGroup._count.id > 0) {
        component.status = incidentGroup._count.id > 2 ? 'critical' : 'degraded';
        component.message = `${incidentGroup._count.id} high priority incidents in last 24 hours`;
      }
    });

    return systemHealth;
  }

  private async getAutomationRuns(businessId: string): Promise<AutomationRun[]> {
    const playbookExecutions = await prisma.playbookExecution.findMany({
      where: {
        incident: {
          IncidentTicket: {
            businessId,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 6,
    });

    return playbookExecutions.map(execution => ({
      workflow: execution.name,
      status: this.mapPlaybookStatus(execution.status),
      timestamp: execution.startedAt,
    }));
  }

  private mapPlaybookStatus(status: string): 'success' | 'failure' | 'running' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
      case 'TERMINATED':
        return 'failure';
      default:
        return 'running';
    }
  }

  private getActiveIncidents(incidents: any[]) {
    return incidents
      .filter(inc => ['OPEN', 'IN_PROGRESS', 'ACKNOWLEDGED'].includes(inc.status))
      .slice(0, 10)
      .map(inc => ({
        id: inc.ticketId,
        title: inc.reason,
        createdAt: inc.createdAt,
        assignedTo: inc.assignedBy?.firstName 
          ? `${inc.assignedBy.firstName} ${inc.assignedBy.lastName}`
          : 'Unassigned',
        status: inc.status,
      }));
  }
}