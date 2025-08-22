export interface TicketDetailResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  customer?: {
    id: string;
    name: string;
    contactEmail: string;
  };
  business?: {
    id: string;
    name: string;
  };
  conversationId?: string;
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TicketParams {
  ticketId: string;
}