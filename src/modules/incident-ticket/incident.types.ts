import { Priority } from "@prisma/client";

export enum IncidentTemplate {
  NONE = "NONE",
  PHISHING = "PHISHING",
  MALWARE = "MALWARE",
}

export type IncidentRequest = {
  template: IncidentTemplate;
  reason: string;
  priority: Priority;
  username: string;
  assignedTo: string;
};

export type UpdateTicket = {
  template: IncidentTemplate;
  reason: string;
  priority: Priority;
  username: string;
  assignedTo: string;
  incidentId: string;
};

export type SLAThresholds = {
  ttr: number;
};
