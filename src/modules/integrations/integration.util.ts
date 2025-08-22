import { BusinessNotificationChannels } from '@prisma/client';
import { Integration } from './integration.type';

/**
 * Maps BusinessNotificationChannels enum values to user-friendly names
 */
const INTEGRATION_NAME_MAP: Record<BusinessNotificationChannels, string> = {
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
export const mapIntegrationsToResponse = (): Integration[] => {
  return Object.values(BusinessNotificationChannels).map((channel) => ({
    name: INTEGRATION_NAME_MAP[channel],
  }));
};

/**
 * Validates if a given string is a valid BusinessNotificationChannel
 * @param channel - The channel string to validate
 * @returns boolean indicating if the channel is valid
 */
export const isValidIntegrationChannel = (channel: string): channel is BusinessNotificationChannels => {
  return Object.values(BusinessNotificationChannels).includes(channel as BusinessNotificationChannels);
};