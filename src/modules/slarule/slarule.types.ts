// SLA Types
export interface SLARule {
  severity: 'critical' | 'high' | 'medium' | 'low';
  responseTimeMinutes: number;
  resolveTimeMinutes: number;
}

export enum SLAStatus {
  PENDING = 'pending',
  MET = 'met',
  BREACHED = 'breached'
}

export interface SLADeadlines {
  respondBy: Date;
  resolveBy: Date;
}

export interface SLABreach {
  incidentId: string;
  slaType: 'ack' | 'resolve';
  breachedAt: Date;
  durationMinutes: number;
}