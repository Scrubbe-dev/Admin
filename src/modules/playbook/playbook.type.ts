// src/types/types.ts

// ... existing interfaces ...

export interface PlaybookResponse {
  id: string;
  title: string;
  steps: string[];
  recommended: boolean;
}

export interface RecommendedPlaybooksResponse {
  ticketId: string;
  playbooks: PlaybookResponse[];
}






