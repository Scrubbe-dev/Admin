import { ChatMessage } from "./ezra.types";

// Global conversation
const conversations: Record<string, ChatMessage[]> = {};

export const getConversation = (userId: string) => {
  return conversations[userId] || [];
};

export const addMessage = (userId: string, message: ChatMessage) => {
  if (!conversations[userId]) conversations[userId] = [];
  conversations[userId].push(message);
};

export const clearConversation = (userId: string) => {
  delete conversations[userId];
};


// incidents conversations
const incidentsConversation: Record<string, any[]> = {};

export const setIncidentConversations = (userId: string, incidents: any[]) => {
  incidentsConversation[userId] = incidents;
};

export const getIncidentsConversation = (userId: string) => {
  return incidentsConversation[userId] || [];
};

export const clearIncidentsConversation = (userId: string) => {
  delete incidentsConversation[userId];
};
