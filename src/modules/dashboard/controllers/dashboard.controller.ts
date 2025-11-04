import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { dashboardFiltersSchema } from '../utils/dashboard.schema';

export class DashboardController {
  private dashboardService = new DashboardService();

  async getDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId!;
      
      // Parse and validate filters
      const filters = req.query.filters 
        ? dashboardFiltersSchema.parse(JSON.parse(req.query.filters as string))
        : {};

      const dashboardData = await this.dashboardService.getDashboardData(businessId, filters);

      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId!;
      const filters = req.query.filters 
        ? dashboardFiltersSchema.parse(JSON.parse(req.query.filters as string))
        : {};

      const dashboardData = await this.dashboardService.getDashboardData(businessId, filters);

      res.json({
        success: true,
        message: 'Dashboard metrics retrieved successfully',
        data: {
          metrics: dashboardData.metrics,
          systemHealth: dashboardData.systemHealth,
          onCallEngineer: dashboardData.onCallEngineer,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getIncidentAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId!;
      const filters = req.query.filters 
        ? dashboardFiltersSchema.parse(JSON.parse(req.query.filters as string))
        : {};

      const dashboardData = await this.dashboardService.getDashboardData(businessId, filters);

      res.json({
        success: true,
        message: 'Incident analytics retrieved successfully',
        data: {
          incidentTrends: dashboardData.incidentTrends,
          recurringIssues: dashboardData.recurringIssues,
          teamWorkload: dashboardData.teamWorkload,
          activeIncidents: dashboardData.activeIncidents,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSLACompliance(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId!;
      const filters = req.query.filters 
        ? dashboardFiltersSchema.parse(JSON.parse(req.query.filters as string))
        : {};

      const dashboardData = await this.dashboardService.getDashboardData(businessId, filters);

      res.json({
        success: true,
        message: 'SLA compliance data retrieved successfully',
        data: {
          slaCompliance: dashboardData.metrics.slaCompliance,
          slaBreaches: dashboardData.slaBreaches,
          recentPostmortems: dashboardData.recentPostmortems,
          automationRuns: dashboardData.automationRuns,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}