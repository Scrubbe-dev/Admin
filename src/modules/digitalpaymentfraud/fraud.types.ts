export type PaymentMethodType = 'credit_card' | 'bank_transfer' | 'digital_wallet' | 'cryptocurrency';
export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'unionpay' | 'other';
export type Recommendation = 'approve' | 'review' | 'reject';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type IOCCategory = 'suspicious' | 'malicious' | 'monitoring' | 'neutral';

export interface PaymentMethod {
  type: PaymentMethodType;
  card_type?: CardType;
  last_four: string;
  tokenized_id: string;
}

export interface Customer {
  id: string;
  email: string;
  ip_address: string;
  device_fingerprint: string;
  account_age_days: number;
  previous_transactions_count: number;
}

export interface Address {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface TransactionMetadata {
  user_agent: string;
  referrer: string;
  session_id: string;
  custom_fields?: Record<string, unknown>;
}

export interface FraudDetectionRequest {
  transaction: {
    id: string;
    timestamp: string;
    amount: number;
    currency: string;
    payment_method: PaymentMethod;
  };
  customer: Customer;
  shipping_address: Address;
  billing_address: Address;
  metadata: TransactionMetadata;
}

export interface RiskFactor {
  type: string;
  severity: SeverityLevel;
  description: string;
  confidence: number;
}

export interface IndicatorOfCompromise {
  type: string;
  value: string;
  category: IOCCategory;
  context: string;
  first_seen?: string;
}

export interface TransactionMetrics {
  transaction_velocity: {
    hour: number;
    day: number;
    week: number;
  };
  historical_patterns: {
    average_transaction_amount: number;
    standard_deviation: number;
    z_score: number;
  };
  customer_risk_profile: {
    score: number;
    percentile: number;
  };
}

export interface FraudAssessment {
  risk_score: number;
  recommendation: Recommendation;
  confidence: number;
}

export interface FraudDetectionResponse {
  request_id: string;
  transaction_id: string;
  timestamp: string;
  fraud_assessment: FraudAssessment;
  risk_factors: RiskFactor[];
  iocs: IndicatorOfCompromise[];
  metrics: TransactionMetrics;
}

export interface ErrorDetail {
  field: string;
  issue: string;
}

export interface ErrorResponse {
  error: {
    request_id: string;
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
}

export type ApiResponse<T = FraudDetectionResponse> = T | ErrorResponse;