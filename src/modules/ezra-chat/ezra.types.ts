import {
  Incident,
  IncidentStatus,
  IncidentTicket,
  Priority,
} from "@prisma/client";
import { Response } from "express";

export type PromptType =
  | "rule"
  | "interpretPrompt"
  | "summarizeIncidents"
  | "recommendedAction"
  | "visualGraph"
  | "rootCauseSuggestion"
  | "generateFiveWhys"
  | "generateStakeHolderMessage"
  | "determineRiskScore";

export interface ExtraData extends Object {
  incidents?: IncidentFetched[];
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
  wantsChart: boolean;
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

export type RecommendedActionResponse = {
  action: (
    | "lock_account"
    | "notify_analyst"
    | "quarantine"
    | "terminate_session"
  )[];
};

export interface VisualGraphResponse {
  chart: {
    type: "bar" | "line" | "donut" | "timeline";
    title: string;
    xLabel: string;
    yLabel: string;
    data: [{ label: string; value: number }];
    timeframe: {
      start: Date;
      end: Date;
    };
    filters: [string, string];
    priority: "Low" | "Medium" | "High" | "Critical" | null;
  } | null;
  followUps: string;
}

export type RootCauseSuggestionResponse = {
  suggestion: string | null;
};

export type FiveWhysResponse = {
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
};

export type StakeHolderMessageResponse = {
  message: string;
};
