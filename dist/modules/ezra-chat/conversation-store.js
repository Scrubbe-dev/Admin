"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearIncidentsConversation = exports.getIncidentsConversation = exports.setIncidentConversations = exports.clearConversation = exports.addMessage = exports.getConversation = void 0;
// Global conversation
const conversations = {};
const getConversation = (userId) => {
    return conversations[userId] || [];
};
exports.getConversation = getConversation;
const addMessage = (userId, message) => {
    if (!conversations[userId])
        conversations[userId] = [];
    conversations[userId].push(message);
};
exports.addMessage = addMessage;
const clearConversation = (userId) => {
    delete conversations[userId];
};
exports.clearConversation = clearConversation;
// incidents conversations
const incidentsConversation = {};
const setIncidentConversations = (userId, incidents) => {
    incidentsConversation[userId] = incidents;
};
exports.setIncidentConversations = setIncidentConversations;
const getIncidentsConversation = (userId) => {
    return incidentsConversation[userId] || [];
};
exports.getIncidentsConversation = getIncidentsConversation;
const clearIncidentsConversation = (userId) => {
    delete incidentsConversation[userId];
};
exports.clearIncidentsConversation = clearIncidentsConversation;
