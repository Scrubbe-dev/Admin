// Add to your existing types.ts file

export interface ContactUsRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  job_title?: string;
  message: string;
}

export interface ContactUsResponse {
  success: boolean;
  message: string;
}

export interface ContactUsValidationResult {
  isValid: boolean;
  errors: string[];
}