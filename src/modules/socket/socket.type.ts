export interface JoinPayload {
  incidentTicketId: string;
}

export interface SendMessagePayload {
  incidentTicketId: string;
  content: string;
}
