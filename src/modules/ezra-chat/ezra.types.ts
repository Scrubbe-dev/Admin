import { Incident, IncidentStatus, IncidentTicket, Priority } from "@prisma/client";
import { Response } from "express";

export type PromptType =
  | "rule"
  | "interpretPrompt"
  | "summarizeIncidents"
  | "determineRiskScore";

export interface ExtraData extends Object {
  incidents?: IncidentFetched[];
  singleIncident?: IncidentTicket
}

export type JsonSchemaFormat = {
  type: "json_schema";
  incidents: {
    id: string;
    status: IncidentStatus;
    title: string;
    description: string;
    priority: Priority;
    createdAt: Date;
  };
};

export interface TimeFrame {
  start: Date;
  end: Date;
}

export type SummarizePromptResponse = {
  priority: string | null;
  timeframe: {
    start: Date;
    end: Date;
  };
  searchTerms: string[];
  wantsAction: boolean;
  incidentTicketId: string | null;
};

export type SummariesResponse = {
  summaries: {
    incident: string;
    priority: string;
    status: string;
    description: string;
  }[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

// for seperation of uses from Javascript and Express response
export interface ExpressResponse extends Response {}

export type IncidentFetched = {
  id: string;
  title: string;
  description: string;
  // status: IncidentStatus;
  priority: Priority;
  createdAt: Date;
  number: number;
};

export type MappedIncidents = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  createdAt: Date;
};

export type RiskScore = {
  score: number;
};
