import { ChatMessage } from "./ezra.types";

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
