import {
  IncidentStatus,
  Priority,
  CauseCategory,
  FollowUpStatus,
  COMMUNICATION_CHANNEL,
  BusinessNotificationChannels,
  BusinessPrefferedIntegration,
} from "@prisma/client";

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

export interface ResolveIncidentRequest {
  rootCauseAnalysis: {
    causeCategory: CauseCategory;
    rootCause: string;
    fiveWhys: {
      why1: string;
      why2: string;
      why3: string;
      why4: string;
      why5: string;
    };
  };
  resolutionDetails: {
    temporaryFix: string;
    permanentFix: string;
  };
  knowledgeDraft: {
    internalKb: {
      title: string;
      summary: string;
      identificationSteps: string;
      resolutionSteps: string;
      preventiveMeasures: string;
      tags: string[];
    };
  };
  followUpActions: {
    task: string;
    owner: string;
    dueDate: Date;
    status: FollowUpStatus;
    ticketingSystems: BusinessPrefferedIntegration[];
  };
  stakeHolder: {
    communicationChannel: COMMUNICATION_CHANNEL;
    targetStakeholders: string[];
    messageContent: string;
  };
}

export interface CustomerFacingKbRequest {
  title: string;
  summary: string;
}
