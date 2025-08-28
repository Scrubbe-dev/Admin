import { EscalatedIncident } from "../escalate/escalate.type";

export interface IntelResponse {
  intelType: string;
  details: string;
}

export interface IncidentTicket {
  id: string;
  businessId?: string;
  escalations: EscalatedIncident[];
  intel: Intel[];
}


export interface Intel {
  id: string;
  incidentTicketId: string;
  intelType: string;
  details: string;
  createdAt: Date;
}
