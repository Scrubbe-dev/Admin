// src/types/index.ts
export interface AnalysisFinding {
    type: string;
    description: string;
    confidence: number;
    keywords?: string[];
  }
  
  export interface DomainAnalysis {
    is_suspicious: boolean;
    findings: AnalysisFinding[];
  }
  
  export interface SenderAnalysis {
    is_suspicious: boolean;
    findings: AnalysisFinding[];
  }
  
  export interface ContentAnalysis {
    is_suspicious: boolean;
    findings: AnalysisFinding[];
  }
  
  export interface Analysis {
    domain_analysis: DomainAnalysis;
    sender_analysis: SenderAnalysis;
    content_analysis: ContentAnalysis;
  }
  
  export interface IOC {
    type: 'email' | 'domain' | 'pattern';
    value: string;
    description: string;
    confidence: 'low' | 'medium' | 'high';
  }
  
  export interface RecommendedAction {
    action: string;
    description: string;
    automated: boolean;
  }
  
  export interface AnalysisReport {
    request_id: string;
    timestamp: string;
    status: 'completed' | 'failed';
    risk_score: number;
    verdict: 'low_risk' | 'medium_risk' | 'high_risk';
    analysis: Analysis;
    iocs: IOC[];
    recommended_actions: RecommendedAction[];
  }
  
  export interface EmailRequest {
    senderEmail: string;
    displayName: string;
    subject: string;
    content: string;
    legitimateDomains?: string[];
  }
  
  export interface ErrorResponse {
    request_id: string;
    timestamp: string;
    status: 'error';
    code: string;
    message: string;
    details?: unknown;
  }
  
  export type ApiResponse<T = AnalysisReport> = T | ErrorResponse;
  
  declare global {
    namespace Express {
      interface Request {
        requestId: string;
      }
    }
  }