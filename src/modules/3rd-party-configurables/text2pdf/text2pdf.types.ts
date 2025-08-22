export interface PdfGenerationResponse {
  success: boolean;
  message: string;
  filename?: string;
  size?: number;
}

export interface CompanyBranding {
  companyName: string;
  logo?: Buffer;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface PdfTemplate {
  name: string;
  headerHeight: number;
  footerHeight: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}


export interface PdfGenerationRequest {
  id: string;
  description: string;
  template?: 'standard' | 'incident' | 'report';
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    department?: string;
    type?: string;
    [key: string]: any;
  };
}

export interface PdfGenerationResponse {
  success: boolean;
  buffer?: Buffer;
  error?: string;
  documentId: string;
  generatedAt: Date;
  metadata: {
    pages: number;
    size: number;
    format: string;
  };
}

export interface CompanyBranding {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

// Enhanced types for incident reports
export interface IncidentMetrics {
  mttd: number; // Mean Time to Detection (minutes)
  mttr: number; // Mean Time to Resolution (minutes)
  mtbf?: number; // Mean Time Between Failures (hours)
}

export interface SLABreach {
  slaName: string;
  targetTime: number;
  actualTime: number;
  breachDuration: number;
}
