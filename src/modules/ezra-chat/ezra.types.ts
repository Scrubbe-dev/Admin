import { Incident, IncidentStatus, Priority } from "@prisma/client";
import { Response } from "express";

export type PromptType = "rule" | "interpretPrompt" | "summarizeIncidents";

export interface ExtraData {
  incidents?: Incident[];
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

export type SummarizeIncidentResponse = {
  priority: string | null;
  timeframe: {
    start: Date;
    end: Date;
  };
  searchTerms: string[];
  wantsAction: boolean;
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

// for seperation of response from Javascript and Express response
export interface ExpressResponse extends Response {}
