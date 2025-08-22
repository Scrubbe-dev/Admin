export interface Integration {
  name: string;
}

export interface IntegrationResponse {
  success: boolean;
  data: Integration[];
  message?: string;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
}