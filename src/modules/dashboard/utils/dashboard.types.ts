export interface DashboardMetrics {
  openIncidents: number;
  mtta: number; 
  mttr: number; 
  slaCompliance: number;
}

export interface IncidentTrendData {
  date: string;
  opened: number;
  resolved: number;
}

export interface RecurringIssue {
  issue: string;
  count: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TeamWorkload {
  teamMember: string;
  incidentCount: number;
  assignedIncidents: number;
}

export interface SLABreach {
  incidentId: string;
  title: string;
  timeToBreach: number; // minutes
  breachType: 'ACK' | 'RESOLVE';
}

export interface SystemHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
}

export interface PostmortemSummary {
  id: string;
  title: string;
  createdAt: Date;
  incidentId: string;
}

export interface AutomationRun {
  workflow: string;
  status: 'success' | 'failure' | 'running';
  timestamp: Date;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  incidentTrends: IncidentTrendData[];
  recurringIssues: RecurringIssue[];
  teamWorkload: TeamWorkload[];
  slaBreaches: SLABreach[];
  systemHealth: SystemHealth[];
  recentPostmortems: PostmortemSummary[];
  automationRuns: AutomationRun[];
  activeIncidents: Array<{
    id: string;
    title: string;
    createdAt: Date;
    assignedTo: string;
    status: string;
  }>;
  onCallEngineer: {
    name: string;
    email: string;
    shiftEnd: Date;
  };
}

export interface DashboardFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  team?: string;
  priority?: string[];
  status?: string[];
}