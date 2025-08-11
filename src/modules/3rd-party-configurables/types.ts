export interface DefaultChannelRequest {
  channelId: string;
}

export type NotificationProvider =
  | "SLACK"
  | "MICROSOFT_TEAMS"
  | "SMS"
  | "EMAIL";
