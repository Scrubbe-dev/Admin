"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fraud_service_1 = require("./fraud.service");
const bec_middleware_1 = require("../bec/bec.middleware");
const logger_1 = require("../../common/logger/logger");
const fraud_schema_1 = require("./fraud.schema");
const router = express_1.default.Router();
const fraudService = new fraud_service_1.FraudDetectionService();
/**
 * @swagger
 * tags:
 *   - name: Fraud Detection
 *     description: Digital payment fraud detection and prevention
 *
 * components:
 *   securitySchemes:
 *     apiKey:
 *       type: apiKey
 *       in: header
 *       name: X-API-KEY
 *       description: API key for authentication
 *       x-default: "your_api_key_here"
 *
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - id
 *         - timestamp
 *         - amount
 *         - currency
 *         - payment_method
 *       properties:
 *         id:
 *           type: string
 *           example: "txn_789012345678"
 *           description: Unique transaction identifier
 *           minLength: 8
 *           maxLength: 24
 *           pattern: "^[a-zA-Z0-9_]+$"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-04-05T14:30:00Z"
 *           description: ISO 8601 timestamp of transaction
 *         amount:
 *           type: number
 *           format: double
 *           minimum: 0.01
 *           maximum: 1000000
 *           example: 1299.99
 *           description: Transaction amount in specified currency
 *         currency:
 *           type: string
 *           example: "USD"
 *           description: ISO 4217 currency code
 *           enum: ["USD", "EUR", "GBP", "JPY", "CAD"]
 *           pattern: "^[A-Z]{3}$"
 *         payment_method:
 *           $ref: '#/components/schemas/PaymentMethod'
 *
 *     PaymentMethod:
 *       type: object
 *       required:
 *         - type
 *         - last_four
 *         - tokenized_id
 *       properties:
 *         type:
 *           type: string
 *           enum: ["credit_card", "bank_transfer", "digital_wallet", "cryptocurrency"]
 *           example: "credit_card"
 *           description: Type of payment method used
 *         card_type:
 *           type: string
 *           example: "visa"
 *           enum: ["visa", "mastercard", "amex", "discover", "jcb", "unionpay"]
 *           description: Required when type=credit_card
 *         last_four:
 *           type: string
 *           example: "4242"
 *           pattern: "^[0-9]{4}$"
 *           description: Last four digits of payment instrument
 *         tokenized_id:
 *           type: string
 *           example: "tok_789xyz456"
 *           minLength: 8
 *           maxLength: 32
 *           description: Payment processor token identifier
 *
 *     Customer:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - ip_address
 *         - device_fingerprint
 *         - account_age_days
 *         - previous_transactions_count
 *       properties:
 *         id:
 *           type: string
 *           example: "cust_789012345678"
 *           description: Unique customer identifier
 *         email:
 *           type: string
 *           format: email
 *           example: "customer@example.com"
 *           description: Customer email address (hashed/tokenized in production)
 *         ip_address:
 *           type: string
 *           format: ipv4
 *           example: "192.168.1.1"
 *           description: IP address where transaction originated
 *         device_fingerprint:
 *           type: string
 *           example: "device_fp_789xyz"
 *           description: Unique device fingerprint hash
 *         account_age_days:
 *           type: integer
 *           minimum: 0
 *           maximum: 36500
 *           example: 180
 *           description: Days since customer account creation
 *         previous_transactions_count:
 *           type: integer
 *           minimum: 0
 *           example: 12
 *           description: Count of previous successful transactions
 *
 *     Address:
 *       type: object
 *       required:
 *         - name
 *         - address_line1
 *         - city
 *         - state
 *         - postal_code
 *         - country
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *           description: Full name of recipient
 *         address_line1:
 *           type: string
 *           example: "123 Main St"
 *           description: Primary street address
 *         address_line2:
 *           type: string
 *           example: "Apt 4B"
 *           description: Secondary address information
 *         city:
 *           type: string
 *           example: "New York"
 *           description: City name
 *         state:
 *           type: string
 *           example: "NY"
 *           description: State/province code
 *         postal_code:
 *           type: string
 *           example: "10001"
 *           description: Postal/ZIP code
 *         country:
 *           type: string
 *           example: "US"
 *           description: ISO 3166-1 alpha-2 country code
 *
 *     TransactionMetadata:
 *       type: object
 *       required:
 *         - user_agent
 *         - referrer
 *         - session_id
 *       properties:
 *         user_agent:
 *           type: string
 *           example: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
 *           description: HTTP User-Agent header from client
 *         referrer:
 *           type: string
 *           format: uri
 *           example: "https://merchant.com/checkout"
 *           description: Referring URL if available
 *         session_id:
 *           type: string
 *           example: "sess_789xyz456"
 *           description: Session identifier
 *         custom_fields:
 *           type: object
 *           additionalProperties: true
 *           description: Merchant-specific custom data
 *           example:
 *             promotion_code: "SPRING25"
 *             checkout_method: "guest"
 *
 *     FraudDetectionRequest:
 *       type: object
 *       required:
 *         - transaction
 *         - customer
 *         - shipping_address
 *         - billing_address
 *         - metadata
 *       properties:
 *         transaction:
 *           $ref: '#/components/schemas/Transaction'
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         shipping_address:
 *           $ref: '#/components/schemas/Address'
 *         billing_address:
 *           $ref: '#/components/schemas/Address'
 *         metadata:
 *           $ref: '#/components/schemas/TransactionMetadata'
 *
 *     RiskFactor:
 *       type: object
 *       required:
 *         - type
 *         - severity
 *         - description
 *         - confidence
 *       properties:
 *         type:
 *           type: string
 *           enum: ["ip_geolocation_mismatch", "transaction_velocity", "address_mismatch", "payment_method_risk", "device_reputation", "behavioral_anomaly"]
 *           example: "ip_geolocation_mismatch"
 *           description: Type of risk factor detected
 *         severity:
 *           type: string
 *           enum: ["low", "medium", "high", "critical"]
 *           example: "medium"
 *           description: Severity level of the risk
 *         description:
 *           type: string
 *           example: "IP location differs from billing country"
 *           description: Human-readable explanation of the risk
 *         confidence:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           example: 0.85
 *           description: Confidence score of the detection (0-1)
 *
 *     IndicatorOfCompromise:
 *       type: object
 *       required:
 *         - type
 *         - value
 *         - category
 *         - context
 *       properties:
 *         type:
 *           type: string
 *           enum: ["ip_address", "device_fingerprint", "email", "payment_token", "session_id"]
 *           example: "ip_address"
 *           description: Type of indicator
 *         value:
 *           type: string
 *           example: "192.168.1.1"
 *           description: The actual indicator value
 *         category:
 *           type: string
 *           enum: ["suspicious", "malicious", "monitoring", "neutral"]
 *           example: "suspicious"
 *           description: Threat classification
 *         context:
 *           type: string
 *           example: "Previously associated with 3 fraudulent transactions"
 *           description: Additional context about the indicator
 *         first_seen:
 *           type: string
 *           format: date-time
 *           example: "2025-01-15T08:22:31Z"
 *           description: When this indicator was first observed
 *
 *     TransactionMetrics:
 *       type: object
 *       required:
 *         - transaction_velocity
 *         - historical_patterns
 *         - customer_risk_profile
 *       properties:
 *         transaction_velocity:
 *           type: object
 *           properties:
 *             hour:
 *               type: integer
 *               example: 3
 *               description: Transactions in last hour
 *             day:
 *               type: integer
 *               example: 5
 *               description: Transactions in last 24 hours
 *             week:
 *               type: integer
 *               example: 12
 *               description: Transactions in last 7 days
 *         historical_patterns:
 *           type: object
 *           properties:
 *             average_transaction_amount:
 *               type: number
 *               example: 352.47
 *               description: Historical average transaction amount
 *             standard_deviation:
 *               type: number
 *               example: 124.86
 *               description: Standard deviation of transaction amounts
 *             z_score:
 *               type: number
 *               example: 7.59
 *               description: Z-score of current transaction amount
 *         customer_risk_profile:
 *           type: object
 *           properties:
 *             score:
 *               type: integer
 *               example: 18
 *               description: Customer's risk score (0-100)
 *             percentile:
 *               type: integer
 *               example: 22
 *               description: Customer's risk percentile (0-100)
 *
 *     FraudAssessment:
 *       type: object
 *       required:
 *         - risk_score
 *         - recommendation
 *         - confidence
 *       properties:
 *         risk_score:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 27
 *           description: Composite risk score (0-100)
 *         recommendation:
 *           type: string
 *           enum: ["approve", "review", "reject"]
 *           example: "approve"
 *           description: Recommended action based on risk
 *         confidence:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           example: 0.92
 *           description: Confidence in the assessment (0-1)
 *
 *     FraudDetectionResponse:
 *       type: object
 *       required:
 *         - request_id
 *         - transaction_id
 *         - timestamp
 *         - fraud_assessment
 *       properties:
 *         request_id:
 *           type: string
 *           example: "fraud-req-a1b2c3d4"
 *           description: Unique request identifier
 *         transaction_id:
 *           type: string
 *           example: "txn_789012345678"
 *           description: Original transaction ID
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-04-05T14:30:05Z"
 *           description: When the analysis was completed
 *         fraud_assessment:
 *           $ref: '#/components/schemas/FraudAssessment'
 *         risk_factors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RiskFactor'
 *           description: Detailed risk factors identified
 *         iocs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IndicatorOfCompromise'
 *           description: Indicators of compromise detected
 *         metrics:
 *           $ref: '#/components/schemas/TransactionMetrics'
 *         _metadata:
 *           type: object
 *           properties:
 *             version:
 *               type: string
 *               example: "1.2.3"
 *               description: API version
 *             env:
 *               type: string
 *               example: "production"
 *               description: Deployment environment
 *
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - request_id
 *         - timestamp
 *         - status
 *         - code
 *         - message
 *       properties:
 *         request_id:
 *           type: string
 *           example: "fraud-req-a1b2c3d4"
 *           description: Unique request identifier
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-04-05T14:30:05Z"
 *           description: When the error occurred
 *         status:
 *           type: string
 *           example: "error"
 *           description: Response status
 *         code:
 *           type: string
 *           example: "VALIDATION_ERROR"
 *           description: Machine-readable error code
 *         message:
 *           type: string
 *           example: "Invalid request parameters"
 *           description: Human-readable error message
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "transaction.amount"
 *                 description: Field path with error
 *               issue:
 *                 type: string
 *                 example: "Must be positive number"
 *                 description: Description of the issue
 *           description: Detailed validation errors when available
 *
 * /api/v1/fraud-detection:
 *   post:
 *     summary: Analyze transaction for potential fraud
 *     description: |
 *       Performs comprehensive fraud analysis on digital payment transactions using multiple detection techniques:
 *
 *       ### Detection Methods
 *       - **IP Geolocation Verification**: Compares transaction IP location with billing/shipping addresses
 *       - **Transaction Velocity Analysis**: Checks for unusual transaction frequency patterns
 *       - **Address Mismatch Detection**: Identifies discrepancies between shipping/billing addresses
 *       - **Payment Method Risk Assessment**: Evaluates risk based on payment type and history
 *       - **Device Fingerprint Analysis**: Checks device reputation and association patterns
 *       - **Behavioral Anomaly Detection**: Identifies deviations from normal customer behavior
 *
 *       ### Response Interpretation
 *       - **Risk Score (0-100)**: Higher values indicate greater fraud likelihood
 *       - **Recommendation**: Suggested action (approve/review/reject)
 *       - **Confidence Score**: Reliability of the assessment (0-1)
 *
 *       ### Authentication
 *       Requires valid API key in `X-API-KEY` header
 *     tags:
 *       - Fraud Detection
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       description: Transaction details for fraud analysis
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FraudDetectionRequest'
 *           examples:
 *             basicCreditCard:
 *               summary: Basic credit card transaction
 *               value:
 *                 transaction:
 *                   id: "txn_789012345678"
 *                   timestamp: "2025-04-05T14:30:00Z"
 *                   amount: 1299.99
 *                   currency: "USD"
 *                   payment_method:
 *                     type: "credit_card"
 *                     card_type: "visa"
 *                     last_four: "4242"
 *                     tokenized_id: "tok_789xyz456"
 *                 customer:
 *                   id: "cust_789012345678"
 *                   email: "customer@example.com"
 *                   ip_address: "192.168.1.1"
 *                   device_fingerprint: "device_fp_789xyz"
 *                   account_age_days: 180
 *                   previous_transactions_count: 12
 *                 shipping_address:
 *                   name: "John Doe"
 *                   address_line1: "123 Main St"
 *                   address_line2: "Apt 4B"
 *                   city: "New York"
 *                   state: "NY"
 *                   postal_code: "10001"
 *                   country: "US"
 *                 billing_address:
 *                   name: "John Doe"
 *                   address_line1: "123 Main St"
 *                   address_line2: "Apt 4B"
 *                   city: "New York"
 *                   state: "NY"
 *                   postal_code: "10001"
 *                   country: "US"
 *                 metadata:
 *                   user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
 *                   referrer: "https://merchant.com/checkout"
 *                   session_id: "sess_789xyz456"
 *                   custom_fields:
 *                     promotion_code: "SPRING25"
 *                     checkout_method: "guest"
 *             highRiskCrypto:
 *               summary: High-risk cryptocurrency transaction
 *               value:
 *                 transaction:
 *                   id: "txn_CRYPTO789012"
 *                   timestamp: "2025-04-05T14:35:00Z"
 *                   amount: 8999.99
 *                   currency: "USD"
 *                   payment_method:
 *                     type: "cryptocurrency"
 *                     last_four: "BTC1"
 *                     tokenized_id: "crypto_wallet_xyz"
 *                 customer:
 *                   id: "cust_NEWUSER123"
 *                   email: "newuser@example.com"
 *                   ip_address: "185.143.223.1"
 *                   device_fingerprint: "device_fp_new123"
 *                   account_age_days: 1
 *                   previous_transactions_count: 0
 *                 shipping_address:
 *                   name: "Anonymous Buyer"
 *                   address_line1: "PO Box 123"
 *                   city: "Delaware"
 *                   state: "DE"
 *                   postal_code: "19901"
 *                   country: "US"
 *                 billing_address:
 *                   name: "Different Name"
 *                   address_line1: "456 Other St"
 *                   city: "Newark"
 *                   state: "NJ"
 *                   postal_code: "07102"
 *                   country: "US"
 *                 metadata:
 *                   user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
 *                   referrer: "https://merchant.com/products/123"
 *                   session_id: "sess_new123456"
 *     responses:
 *       200:
 *         description: Successful fraud analysis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FraudDetectionResponse'
 *             examples:
 *               lowRisk:
 *                 summary: Low risk transaction
 *                 value:
 *                   request_id: "fraud-req-a1b2c3d4"
 *                   transaction_id: "txn_789012345678"
 *                   timestamp: "2025-04-05T14:30:05Z"
 *                   fraud_assessment:
 *                     risk_score: 18
 *                     recommendation: "approve"
 *                     confidence: 0.95
 *                   risk_factors: []
 *                   iocs: []
 *                   metrics:
 *                     transaction_velocity:
 *                       hour: 1
 *                       day: 3
 *                       week: 10
 *                     historical_patterns:
 *                       average_transaction_amount: 352.47
 *                       standard_deviation: 124.86
 *                       z_score: 1.2
 *                     customer_risk_profile:
 *                       score: 15
 *                       percentile: 20
 *                   _metadata:
 *                     version: "1.2.3"
 *                     env: "production"
 *               highRisk:
 *                 summary: High risk transaction
 *                 value:
 *                   request_id: "fraud-req-z9y8x7w6"
 *                   transaction_id: "txn_CRYPTO789012"
 *                   timestamp: "2025-04-05T14:35:05Z"
 *                   fraud_assessment:
 *                     risk_score: 82
 *                     recommendation: "reject"
 *                     confidence: 0.88
 *                   risk_factors:
 *                     - type: "payment_method_risk"
 *                       severity: "high"
 *                       description: "Cryptocurrency payments have higher fraud rates"
 *                       confidence: 0.9
 *                     - type: "ip_geolocation_mismatch"
 *                       severity: "medium"
 *                       description: "IP location (RU) differs from billing country (US)"
 *                       confidence: 0.85
 *                     - type: "address_mismatch"
 *                       severity: "medium"
 *                       description: "3 significant differences between shipping and billing addresses"
 *                       confidence: 0.75
 *                   iocs:
 *                     - type: "ip_address"
 *                       value: "185.143.223.1"
 *                       category: "suspicious"
 *                       context: "Previously associated with fraudulent transactions"
 *                       first_seen: "2025-01-15T08:22:31Z"
 *                     - type: "device_fingerprint"
 *                       value: "device_fp_new123"
 *                       category: "monitoring"
 *                       context: "New device fingerprint"
 *                   metrics:
 *                     transaction_velocity:
 *                       hour: 0
 *                       day: 0
 *                       week: 0
 *                     historical_patterns:
 *                       average_transaction_amount: 0
 *                       standard_deviation: 0
 *                       z_score: 0
 *                     customer_risk_profile:
 *                       score: 80
 *                       percentile: 95
 *                   _metadata:
 *                     version: "1.2.3"
 *                     env: "production"
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               request_id: "fraud-req-invalid123"
 *               timestamp: "2025-04-05T14:31:00Z"
 *               status: "error"
 *               code: "VALIDATION_ERROR"
 *               message: "Invalid request parameters"
 *               details:
 *                 - field: "transaction.amount"
 *                   issue: "Must be positive number"
 *                 - field: "customer.email"
 *                   issue: "Invalid email format"
 *       401:
 *         description: Unauthorized - Missing or invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               request_id: "fraud-req-unauth456"
 *               timestamp: "2025-04-05T14:32:00Z"
 *               status: "error"
 *               code: "UNAUTHORIZED"
 *               message: "Invalid API key"
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               request_id: "fraud-req-ratelimit789"
 *               timestamp: "2025-04-05T14:33:00Z"
 *               status: "error"
 *               code: "RATE_LIMIT_EXCEEDED"
 *               message: "Too many requests - please try again later"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               request_id: "fraud-req-servererr012"
 *               timestamp: "2025-04-05T14:34:00Z"
 *               status: "error"
 *               code: "INTERNAL_SERVER_ERROR"
 *               message: "An unexpected error occurred"
 *     x-codeSamples:
 *       - lang: 'JavaScript'
 *         label: 'Node.js (Axios)'
 *         source: |
 *           const axios = require('axios');
 *
 *           const transaction = {
 *             transaction: {
 *               id: "txn_789012345678",
 *               timestamp: "2025-04-05T14:30:00Z",
 *               amount: 1299.99,
 *               currency: "USD",
 *               payment_method: {
 *                 type: "credit_card",
 *                 card_type: "visa",
 *                 last_four: "4242",
 *                 tokenized_id: "tok_789xyz456"
 *               }
 *             },
 *             customer: {
 *               id: "cust_789012345678",
 *               email: "customer@example.com",
 *               ip_address: "192.168.1.1",
 *               device_fingerprint: "device_fp_789xyz",
 *               account_age_days: 180,
 *               previous_transactions_count: 12
 *             },
 *             shipping_address: {
 *               name: "John Doe",
 *               address_line1: "123 Main St",
 *               address_line2: "Apt 4B",
 *               city: "New York",
 *               state: "NY",
 *               postal_code: "10001",
 *               country: "US"
 *             },
 *             billing_address: {
 *               name: "John Doe",
 *               address_line1: "123 Main St",
 *               address_line2: "Apt 4B",
 *               city: "New York",
 *               state: "NY",
 *               postal_code: "10001",
 *               country: "US"
 *             },
 *             metadata: {
 *               user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
 *               referrer: "https://merchant.com/checkout",
 *               session_id: "sess_789xyz456",
 *               custom_fields: {
 *                 promotion_code: "SPRING25",
 *                 checkout_method: "guest"
 *               }
 *             }
 *           };
 *
 *           axios.post('https://api.yourdomain.com/api/v1/fraud-detection', transaction, {
 *             headers: {
 *               'X-API-KEY': 'your_api_key_here'
 *             }
 *           })
 *           .then(response => console.log(response.data))
 *           .catch(error => console.error(error.response.data));
 *       - lang: 'curl'
 *         label: 'cURL'
 *         source: |
 *           curl -X POST \
 *             https://api.yourdomain.com/api/v1/fraud-detection \
 *             -H 'Content-Type: application/json' \
 *             -H 'X-API-KEY: your_api_key_here' \
 *             -d '{
 *               "transaction": {
 *                 "id": "txn_789012345678",
 *                 "timestamp": "2025-04-05T14:30:00Z",
 *                 "amount": 1299.99,
 *                 "currency": "USD",
 *                 "payment_method": {
 *                   "type": "credit_card",
 *                   "card_type": "visa",
 *                   "last_four": "4242",
 *                   "tokenized_id": "tok_789xyz456"
 *                 }
 *               },
 *               "customer": {
 *                 "id": "cust_789012345678",
 *                 "email": "customer@example.com",
 *                 "ip_address": "192.168.1.1",
 *                 "device_fingerprint": "device_fp_789xyz",
 *                 "account_age_days": 180,
 *                 "previous_transactions_count": 12
 *               },
 *               "shipping_address": {
 *                 "name": "John Doe",
 *                 "address_line1": "123 Main St",
 *                 "address_line2": "Apt 4B",
 *                 "city": "New York",
 *                 "state": "NY",
 *                 "postal_code": "10001",
 *                 "country": "US"
 *               },
 *               "billing_address": {
 *                 "name": "John Doe",
 *                 "address_line1": "123 Main St",
 *                 "address_line2": "Apt 4B",
 *                 "city": "New York",
 *                 "state": "NY",
 *                 "postal_code": "10001",
 *                 "country": "US"
 *               },
 *               "metadata": {
 *                 "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
 *                 "referrer": "https://merchant.com/checkout",
 *                 "session_id": "sess_789xyz456",
 *                 "custom_fields": {
 *                   "promotion_code": "SPRING25",
 *                   "checkout_method": "guest"
 *                 }
 *               }
 *             }'
 *     x-links:
 *       - description: Fraud detection API documentation
 *         url: https://docs.yourdomain.com/api/fraud-detection
 *       - description: Fraud prevention best practices
 *         url: https://docs.yourdomain.com/guides/fraud-prevention
 */
router.post('/fraud-detection', bec_middleware_1.requestIdMiddleware, 
//   rateLimitMiddleware,
//@ts-ignore
async (req, res) => {
    try {
        // Validate request
        const validationResult = fraud_schema_1.fraudDetectionSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                //@ts-ignore
                request_id: req.body.requestId,
                timestamp: new Date().toISOString(),
                status: 'error',
                code: 'VALIDATION_ERROR',
                message: 'Invalid request parameters',
                details: validationResult.error.errors.map(err => ({
                    field: err.path.join('.'),
                    issue: err.message
                }))
            });
        }
        const request = validationResult.data;
        const response = await fraudService.analyzeTransaction(request);
        return res.status(200).json({
            ...response,
            _metadata: {
                version: process.env.npm_package_version,
                env: process.env.NODE_ENV
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Fraud detection failed', {
            //@ts-ignore
            requestId: req.requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return res.status(500).json({
            //@ts-ignore
            request_id: req.requestId,
            timestamp: new Date().toISOString(),
            status: 'error',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred during fraud analysis'
        });
    }
});
exports.default = router;
