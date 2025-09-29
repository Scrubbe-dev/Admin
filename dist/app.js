"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const system_routes_1 = __importDefault(require("./modules/system/system.routes"));
const dotenv_1 = require("dotenv");
const swagger_1 = require("./config/swagger");
const bec_routes_1 = __importDefault(require("./modules/bec/bec.routes"));
const fraud_route_1 = __importDefault(require("./modules/digitalpaymentfraud/fraud.route"));
const apikey_route_1 = __importDefault(require("./modules/apikey/apikey.route"));
// for auth
const client_1 = require("@prisma/client");
const auth_routes_1 = require("./modules/auth/routes/auth.routes");
const auth_service_1 = require("./modules/auth/services/auth.service");
const token_service_1 = require("./modules/auth/services/token.service");
const security_utils_1 = require("./modules/auth/utils/security.utils");
const auth_middleware_1 = require("./modules/auth/middleware/auth.middleware");
const auth_controller_1 = require("./modules/auth/controllers/auth.controller");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
// waiting and admin
const waiting_route_1 = __importDefault(require("./modules/waitingmessage/waiting.route"));
const admin_route_1 = __importDefault(require("./modules/admin-auth/admin.route"));
const logger_1 = require("./modules/password-reset/utils/logger");
const rate_limiter_1 = require("./modules/password-reset/utils/rate-limiter");
const error_middleware_1 = require("./middleware/error.middleware");
const business_router_1 = __importDefault(require("./modules/business-profile/business.router"));
const ezra_route_1 = __importDefault(require("./modules/ezra-chat/ezra.route"));
const fingerprint_route_1 = __importDefault(require("./modules/fingerprint/fingerprint.route"));
const data_visual_route_1 = __importDefault(require("./modules/data-visualization/data-visual.route"));
const incident_route_1 = __importDefault(require("./modules/incident-ticket/incident.route"));
const socket_io_1 = require("socket.io");
const socket_1 = require("./modules/socket/socket");
const slack_router_1 = __importDefault(require("./modules/3rd-party-configurables/slack/slack.router"));
const sms_route_1 = __importDefault(require("./modules/3rd-party-configurables/sms/sms.route"));
const meet_route_1 = __importDefault(require("./modules/3rd-party-configurables/google/google-meet/meet.route"));
const whatsapp_route_1 = __importDefault(require("./modules/3rd-party-configurables/whatsapp/whatsapp.route"));
const github_router_1 = __importDefault(require("./modules/3rd-party-configurables/github/github.router"));
const gitlab_router_1 = __importDefault(require("./modules/3rd-party-configurables/gitlab/gitlab.router"));
const email_integration_router_1 = __importDefault(require("./modules/3rd-party-configurables/email-integration/email-integration.router"));
const text2pdf_route_1 = require("./modules/3rd-party-configurables/text2pdf/text2pdf.route");
const routes_1 = __importDefault(require("./modules/tickets/routes"));
const integration_route_1 = __importDefault(require("./modules/integrations/integration.route"));
const intel_route_1 = __importDefault(require("./modules/intel/intel.route"));
const escalate_route_1 = __importDefault(require("./modules/escalate/escalate.route"));
const playbook_route_1 = __importDefault(require("./modules/playbook/playbook.route"));
const ims_router_1 = __importDefault(require("./modules/ims-setup/ims.router"));
const reset_route_1 = __importDefault(require("./modules/password-reset/reset.route"));
// In your main application file (e.g., index.ts or app.ts)
const node_cron_1 = __importDefault(require("node-cron"));
const cleanup_service_1 = require("./modules/auth/services/cleanup.service");
const resend_1 = __importDefault(require("./modules/mocktest/resend"));
const nodemailer_factory_1 = require("./modules/auth/services/nodemailer.factory");
const incidentstatus_routes_1 = __importDefault(require("./modules/incidentStatus/incidentstatus.routes"));
const postmortem_route_1 = __importDefault(require("./modules/postmortem/postmortem.route"));
const pricing_route_1 = __importDefault(require("./modules/pricing/pricing.route"));
const auto_cron_service_1 = require("./modules/auto-sla/auto-cron.service");
const customerAuthRoute_1 = require("./modules/customer/routers/customerAuthRoute");
const customerIncidentRoute_1 = require("./modules/customer/routers/customerIncidentRoute");
(0, dotenv_1.config)();
// SAVE API-KEY TO NEWLY CREATED APIKEY TABLE
/**
 * ========================= ALWAYS RUN BUILD SCRIPT BEFORE PUSHING TO PROD =========================
*/
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const cleanupService = new cleanup_service_1.CleanupService(prisma);
// Initialize SLA monitoring when app starts
const slaCronService = new auto_cron_service_1.SLACronService();
console.log('Automatic SLA monitoring started. The system will:');
console.log('- Scan for new incidents every 2 minutes');
console.log('- Check SLA milestones every 5 minutes');
console.log('- Run comprehensive audit every hour');
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    // path: "/api/v1/incident-ticket/conversation",
    cors: {
        origin: "*",
    },
});
app.set("io", io);
(0, socket_1.initSocket)(io, prisma);
app.set("trust proxy", (ip) => {
    if (ip === "127.0.0.1" || ip === "::1")
        return true;
    return env_1.env.NODE_ENV === "production" ? 2 : false;
});
// Configuration
const config = {
    jwtSecret: env_1.env.JWT_SECRET || "your-secret-key",
    jwtExpiresIn: "1440m", // in mins (1 day)
    refreshTokenExpiresInDays: 7,
    // smtpOptions: {
    //   host: env.SMTP_HOST,
    //   port: parseInt(env.SMTP_PORT || "587"),
    //   auth: {
    //     user: env.SMTP_USER,
    //     pass: env.SMTP_PASS,
    //   },
    // },
    fromEmail: env_1.env.FROM_EMAIL || "no-reply@yourdomain.com",
};
// Initialize logger
const logger = new logger_1.Logger("PasswordReset");
// Initialize rate limiter
const rateLimiter = new rate_limiter_1.RateLimiterService();
// Initialize services
const securityUtils = new security_utils_1.SecurityUtils();
const tokenService = new token_service_1.TokenService(config.jwtSecret, config.jwtExpiresIn, config.refreshTokenExpiresInDays);
// BEFORE PUSHING TO PROD, COMMENT OUT LOCAL DB AND USE PROD DB IN ENV
// const emailService = new ResendEmailService(resendConfig); // verification token service
const emailService = (0, nodemailer_factory_1.createEmailService)();
// const emailServices = new EmailServices();
const authService = new auth_service_1.AuthService(prisma, tokenService, securityUtils, emailService);
const authMiddleware = new auth_middleware_1.AuthMiddleware(tokenService);
const authController = new auth_controller_1.AuthController(authService);
console.log(__dirname, "CURRENT DIRECTORY NAME");
// Middleware
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
}));
app.use((0, morgan_1.default)("combined"));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
(0, swagger_1.setupSwagger)(app);
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
// Run cleanup job every hour
app.use(limiter);
// Routes
app.use("/api/v1/business/", business_router_1.default);
app.use("/api/v1", waiting_route_1.default);
app.use("/api/v1", admin_route_1.default);
app.use("/api/v1/auth/", (0, auth_routes_1.createAuthRouter)(authController, authMiddleware));
app.use("/api/v1/ezra/", ezra_route_1.default);
app.use("/api/v1/data-visual/", data_visual_route_1.default);
app.use("/api/v1/fingerprint/", fingerprint_route_1.default);
app.use("/api/v1/incident-ticket/", incident_route_1.default);
app.use("/api/v1/apikey", apikey_route_1.default);
app.use("/api/v1/integrations/slack", slack_router_1.default);
app.use("/api/v1/integrations/sms", sms_route_1.default);
app.use("/api/v1/integrations/google/meet", meet_route_1.default);
app.use("/api/v1/integrations/whatsapp", whatsapp_route_1.default);
app.use("/api/v1/integrations/github", github_router_1.default);
app.use("/api/v1/integrations/gitlab", gitlab_router_1.default);
app.use("/api/v1/integrations/email", email_integration_router_1.default);
app.use("/api/v1", integration_route_1.default); // New Integration route
app.use("/api/v1", bec_routes_1.default);
app.use("/api/v1", system_routes_1.default);
app.use("/api/v1", fraud_route_1.default);
app.use('/api/v1', reset_route_1.default);
app.use("/api/v1", text2pdf_route_1.pdfRoutes); // New  pdf file generation route
app.use("/api/v1", routes_1.default); // New  ticket management route
app.use("/api/v1", intel_route_1.default); // New  intel file generation route
app.use("/api/v1", escalate_route_1.default); // New  escalate management route
app.use("/api/v1", playbook_route_1.default); // New  playbook management route
app.use("/api/v1", ims_router_1.default); // New  IMS management route
app.use("/api/v1", resend_1.default); // New  IMS management route
app.use("/api/v1", incidentstatus_routes_1.default); // New incidentStats route 
app.use("/api/v1", postmortem_route_1.default); // New Postmortum route
app.use("/api/v1/pricing", pricing_route_1.default);
app.use("/api/v1/mocktest", customerAuthRoute_1.customerAuthRoutes); // Route for customer auth route
app.use("/api/v1/mocktest", customerIncidentRoute_1.customerIncidentRoutes); // Route for  customer incident route
// Add password reset routes
// app.use('/api/v1/auth', passwordResetRoutes.getRouter());
// app.use((err: Error, req: express.Request, res: express.Response) => {
//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode).json({
//     success: false,
//     error: 'Internal server error'
//   });
// });
node_cron_1.default.schedule('0 */6 * * *', async () => {
    console.log('Running token cleanup job...');
    await cleanupService.cleanupExpiredTokens();
});
app.use((err, req, res, next) => {
    (0, error_middleware_1.errorHandler)(err, req, res, next);
});
// app.listen(env.PORT, () => {
//   console.log(`Server running on port ${env.PORT}`);
// });
// For graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down SLA monitoring...');
    slaCronService.stop();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Shutting down SLA monitoring...');
    slaCronService.stop();
    process.exit(0);
});
server.listen(env_1.env.PORT, () => {
    console.log(`Server running on port ${env_1.env.PORT}`);
});
