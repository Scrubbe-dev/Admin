export interface JoinPayload {
  conversationId: string; 
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
}
