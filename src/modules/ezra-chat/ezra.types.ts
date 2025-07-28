import { IncidentStatus, Priority } from "@prisma/client";

export type PromptType = "rule" | "interpretSummary" | "summarizeIncidents";

export interface ExtraData {
  incidents?: any[];
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
};
