import { IncidentStatus, Priority } from "@prisma/client";

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
  createdFrom?: string;
};

export type UpdateTicket = {
  template: IncidentTemplate;
  reason: string;
  priority: Priority;
  username: string;
  assignedTo: string;
  incidentId: string;
  status: IncidentStatus;
};

export type SLAThresholds = {
  ttr: number;
};

export type CommentRequest = {
  content: string;
};

export type MappedComment = {
  id: string;
  content: string;
  createdAt: Date;
  firstname: string | null;
  lastname: string | null;
  isBusinessOwner: boolean;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  firstname: string | null;
  lastname: string | null;
  isBusinessOwner: boolean;
};
