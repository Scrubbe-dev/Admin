export interface SlackDataResponse {
  ok: boolean;
  app_id: string;
  authed_user: {
    id: string;
  };
  scope: string;
  token_type: string;
  access_token: string;
  bot_user_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise: null;
  is_enterprise_install: boolean;
}

export interface SlackSlashCommandRequest {
  command: SlackSlashCommand;
  text: string;
}

// add more slash commands when needed
export type SlackSlashCommand = "/incident-status" | "/incident-close";
