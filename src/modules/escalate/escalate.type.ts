export interface EscalateRequest {
  escalatedTo: string; // email of the user to escalate to
  reason?: string;    // optional reason for escalation
}

export interface EscalateResponse {
  ticketId: string;
  escalatedTo: string; // role of the user (e.g., "Level 2 Support")
  timestamp: string;
}

export interface EscalatedIncident {
  id: string;
  incidentTicketId: string;
  escalatedToUserId: string;
  escalatedById: string;
  escalationReason?: string;
  escalatedAt: Date;
  status: EscalationStatus;
}

export enum EscalationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// Extend existing types with new relations
export interface User {
  id: string;
  email: string;
  role: string;
  businessId?: string;
  escalatedIncidentsReceived: EscalatedIncident[];
  escalatedIncidentsMade: EscalatedIncident[];
  // ... other existing fields
}

