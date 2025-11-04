import { DashboardFilters, IncidentTrendData, RecurringIssue, TeamWorkload } from './dashboard.types';

export class DashboardUtils {
  static calculateMTTA(incidents: any[]): number {
    const acknowledgedIncidents = incidents.filter(inc => inc.firstAcknowledgedAt);
    if (acknowledgedIncidents.length === 0) return 0;

    const totalTime = acknowledgedIncidents.reduce((sum, inc) => {
      const created = new Date(inc.createdAt);
      const acknowledged = new Date(inc.firstAcknowledgedAt!);
      return sum + (acknowledged.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / acknowledgedIncidents.length / (1000 * 60)); // Convert to minutes
  }

  static calculateMTTR(incidents: any[]): number {
    const resolvedIncidents = incidents.filter(inc => inc.resolvedAt);
    if (resolvedIncidents.length === 0) return 0;

    const totalTime = resolvedIncidents.reduce((sum, inc) => {
      const created = new Date(inc.createdAt);
      const resolved = new Date(inc.resolvedAt!);
      return sum + (resolved.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / resolvedIncidents.length / (1000 * 60)); // Convert to minutes
  }

  static calculateSLACompliance(incidents: any[]): number {
    const totalIncidents = incidents.length;
    if (totalIncidents === 0) return 100;

    const compliantIncidents = incidents.filter(inc => {
      if (!inc.slaTargetResolve || !inc.resolvedAt) return false;
      const resolved = new Date(inc.resolvedAt);
      const slaTarget = new Date(inc.slaTargetResolve);
      return resolved <= slaTarget;
    });

    return Math.round((compliantIncidents.length / totalIncidents) * 100);
  }

  static generateIncidentTrends(incidents: any[], days: number = 30): IncidentTrendData[] {
    const trends: IncidentTrendData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dayIncidents = incidents.filter(inc => {
        const incDate = new Date(inc.createdAt).toISOString().split('T')[0];
        return incDate === dateString;
      });

      const resolvedIncidents = incidents.filter(inc => {
        if (!inc.resolvedAt) return false;
        const resolvedDate = new Date(inc.resolvedAt).toISOString().split('T')[0];
        return resolvedDate === dateString;
      });

      trends.push({
        date: dateString,
        opened: dayIncidents.length,
        resolved: resolvedIncidents.length,
      });
    }

    return trends;
  }

  static identifyRecurringIssues(incidents: any[]): RecurringIssue[] {
    const issueCounts: Record<string, number> = {};

    incidents.forEach(incident => {
      const key = incident.reason || incident.title;
      if (key) {
        issueCounts[key] = (issueCounts[key] || 0) + 1;
      }
    });

    return Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({
        issue,
        count,
        trend: 'stable' // This would require historical data for proper trend analysis
      }));
  }

  static calculateTeamWorkload(incidents: any[], users: any[]): TeamWorkload[] {
    const workload: Record<string, { incidentCount: number; assignedIncidents: number }> = {};

    incidents.forEach(incident => {
      if (incident.assignedToEmail) {
        const assignee = incident.assignedToEmail;
        if (!workload[assignee]) {
          workload[assignee] = { incidentCount: 0, assignedIncidents: 0 };
        }
        workload[assignee].assignedIncidents++;
      }

      if (incident.createdBy?.email) {
        const creator = incident.createdBy.email;
        if (!workload[creator]) {
          workload[creator] = { incidentCount: 0, assignedIncidents: 0 };
        }
        workload[creator].incidentCount++;
      }
    });

    return Object.entries(workload).map(([teamMember, data]) => ({
      teamMember,
      incidentCount: data.incidentCount,
      assignedIncidents: data.assignedIncidents,
    }));
  }

  static buildWhereClause(filters: DashboardFilters) {
    const where: any = {};

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    return where;
  }
}