"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIntegrationChannel = exports.mapIntegrationsToResponse = void 0;
const client_1 = require("@prisma/client");
/**
 * Maps BusinessNotificationChannels enum values to user-friendly names
 */
const INTEGRATION_NAME_MAP = {
    SLACK: 'Slack',
    MICROSOFT_TEAMS: 'Microsoft Teams',
    SMS: 'SMS',
    EMAIL: 'Email',
    GOOGLE_MEET: 'Google Meet',
    ZOOM: 'Zoom',
    PAGERDUTY: 'PagerDuty',
    GITHUB: 'Github',
    GITLAB: 'Gitlab',
    WHATSAPP: 'WhatsApp',
};
/**
 * Converts BusinessNotificationChannels enum values to Integration objects
 * @returns Array of Integration objects with user-friendly names
 */
const mapIntegrationsToResponse = () => {
    return Object.values(client_1.BusinessNotificationChannels).map((channel) => ({
        name: INTEGRATION_NAME_MAP[channel],
    }));
};
exports.mapIntegrationsToResponse = mapIntegrationsToResponse;
/**
 * Validates if a given string is a valid BusinessNotificationChannel
 * @param channel - The channel string to validate
 * @returns boolean indicating if the channel is valid
 */
const isValidIntegrationChannel = (channel) => {
    return Object.values(client_1.BusinessNotificationChannels).includes(channel);
};
exports.isValidIntegrationChannel = isValidIntegrationChannel;
