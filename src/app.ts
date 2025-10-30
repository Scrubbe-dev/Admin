import express from "express";
import helmet from "helmet";
import http from "http";
import cors from "cors";
import { env } from "./config/env";
import systemRouter from "./modules/system/system.routes";
import { config as dotenvConfig } from "dotenv";
import { setupSwagger } from "./config/swagger";
import analysisRouter from "./modules/bec/bec.routes";
import fraudDictation from "./modules/digitalpaymentfraud/fraud.route";
import apikeyRoute from "./modules/apikey/apikey.route";

// for auth
import { PrismaClient } from "@prisma/client";
import { createAuthRouter } from "./modules/auth/routes/auth.routes";
import { AuthService } from "./modules/auth/services/auth.service";
import { TokenService } from "./modules/auth/services/token.service";
import { EmailServices } from "./modules/password-reset/email.services";
import { SecurityUtils } from "./modules/auth/utils/security.utils";
import { AuthMiddleware } from "./modules/auth/middleware/auth.middleware";
import { AuthController } from "./modules/auth/controllers/auth.controller";
// import { EmailServices } from './modules/password-reset/email.services';
import { ResendEmailService } from './modules/auth/services/resend.service'
import rateLimit from "express-rate-limit";
import morgan from "morgan";

// waiting and admin
import waitingRouter from "./modules/waitingmessage/waiting.route";
import adminRouter from "./modules/admin-auth/admin.route";

// Import password reset components
import { PasswordResetService } from "./modules/password-reset/reset.services";
import { PasswordResetController } from "./modules/password-reset/reset.controller";
import { PasswordResetMiddleware } from "./modules/password-reset/reset.middleware";
import { Logger } from "./modules/password-reset/utils/logger";
import { RateLimiterService } from "./modules/password-reset/utils/rate-limiter";
// import { EmailService } from "./modules/auth/services/email.service";
import { SendGridEmailService } from './modules/auth/services/sendgrid-email.service'
import { errorHandler } from "./middleware/error.middleware";
import businessRouter from "./modules/business-profile/business.router";
import ezraRouter from "./modules/ezra-chat/ezra.route";
import fingerprintRouter from "./modules/fingerprint/fingerprint.route";
import dataVisualRouter from "./modules/data-visualization/data-visual.route";
import incidentRouter from "./modules/incident-ticket/incident.route";
import { Server } from "socket.io";
import { initSocket } from "./modules/socket/socket";
import slackRouter from "./modules/3rd-party-configurables/slack/slack.router";
import smsRouter from "./modules/3rd-party-configurables/sms/sms.route";
import meetRouter from "./modules/3rd-party-configurables/google/google-meet/meet.route";
import whatsappRouter from "./modules/3rd-party-configurables/whatsapp/whatsapp.route";
import githubRouter from "./modules/3rd-party-configurables/github/github.router";
import gitlabRouter from "./modules/3rd-party-configurables/gitlab/gitlab.router";
import emailRouter from "./modules/3rd-party-configurables/email-integration/email-integration.router";
import {pdfRoutes} from './modules/3rd-party-configurables/text2pdf/text2pdf.route'
import ticketRoutes from './modules/tickets/routes';
import integrationRouter from './modules/integrations/integration.route';
import intelRouter from "./modules/intel/intel.route";
import escalateRouter from "./modules/escalate/escalate.route";
import playbookRouter from "./modules/playbook/playbook.route";
import imsRouter from "./modules/ims-setup/ims.router";
import passwordResetRouter from "./modules/password-reset/reset.route";
// import {sendGridConfig} from "./config/sendgrid.config"
import { resendConfig } from "./config/resend.config"
// In your main application file (e.g., index.ts or app.ts)


import cron from 'node-cron';
import { CleanupService } from './modules/auth/services/cleanup.service';
import sendMailerRouter from "./modules/mocktest/resend";
import { createEmailService } from "./modules/auth/services/nodemailer.factory";
import incidentStatusEmailrouter from "./modules/incidentStatus/incidentstatus.routes";
import postmortemRouter from "./modules/postmortem/postmortem.route";
import pricingRouter from "./modules/pricing/pricing.route";
import { SLACronService } from "./modules/auto-sla/auto-cron.service";
import { customerAuthRoutes } from "./modules/customer/routers/customerAuthRoute";
import { customerIncidentRoutes } from "./modules/customer/routers/customerIncidentRoute";
import { createEmailServiceWithResend } from "./modules/auth/services/resend-no-nodemailer.factory";
import oncallRouter from "./modules/oncall/oncall.routes";
import contactusRouter from "./modules/contactus/contactus.routes";
import { organizationRoutes } from "./modules/customer/routers/organizationRoute";
import {initSocketGlobally } from "./modules/socket/init-socket";


dotenvConfig();

// SAVE API-KEY TO NEWLY CREATED APIKEY TABLE
/**
 * ========================= ALWAYS RUN BUILD SCRIPT BEFORE PUSHING TO PROD =========================
*/

const app = express();
const prisma = new PrismaClient();

const cleanupService = new CleanupService(prisma);


// Initialize SLA monitoring when app starts
const slaCronService = new SLACronService();

console.log('Automatic SLA monitoring started. The system will:');
console.log('- Scan for new incidents every 2 minutes');
console.log('- Check SLA milestones every 5 minutes');
console.log('- Run comprehensive audit every hour');






const server = http.createServer(app);
const io = initSocketGlobally(server);

app.set("io", io);
initSocket(io, prisma); // Your existing socket initialization logic

app.set("trust proxy", (ip: string) => {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  return env.NODE_ENV === "production" ? 2 : false;
});

// Configuration
const config = {
  jwtSecret: env.JWT_SECRET || "your-secret-key",
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
  fromEmail: env.FROM_EMAIL || "no-reply@yourdomain.com",
};

// Initialize logger
const logger = new Logger("PasswordReset");

// Initialize rate limiter
const rateLimiter = new RateLimiterService();

// Initialize services
const securityUtils = new SecurityUtils();
const tokenService = new TokenService(
  config.jwtSecret,
  config.jwtExpiresIn,
  config.refreshTokenExpiresInDays
);
// BEFORE PUSHING TO PROD, COMMENT OUT LOCAL DB AND USE PROD DB IN ENV
// const emailService = new ResendEmailService(resendConfig); // verification token service
// const emailService = createEmailService();
const emailsServicesWithResend = createEmailServiceWithResend();
// const emailServices = new EmailServices();
const authService = new AuthService(
  prisma,
  tokenService,
  securityUtils,
  emailsServicesWithResend
);
const authMiddleware = new AuthMiddleware(tokenService);
const authController = new AuthController(authService);
console.log(__dirname, "CURRENT DIRECTORY NAME");





// Middleware
app.use(
  cors({
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
  })
);
app.use(morgan("combined"));
app.use(helmet());
app.use(express.json());
setupSwagger(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
// Run cleanup job every hour
app.use(limiter);

// Routes
app.use("/api/v1/business/", businessRouter);
app.use("/api/v1", waitingRouter);
app.use("/api/v1", adminRouter);
app.use("/api/v1/auth/", createAuthRouter(authController, authMiddleware));
app.use("/api/v1/ezra/", ezraRouter);
app.use("/api/v1/data-visual/", dataVisualRouter);
app.use("/api/v1/fingerprint/", fingerprintRouter);
app.use("/api/v1/incident-ticket/", incidentRouter);
app.use("/api/v1/apikey", apikeyRoute);
app.use("/api/v1/integrations/slack", slackRouter);
app.use("/api/v1/integrations/sms", smsRouter);
app.use("/api/v1/integrations/google/meet", meetRouter);
app.use("/api/v1/integrations/whatsapp", whatsappRouter);
app.use("/api/v1/integrations/github", githubRouter);
app.use("/api/v1/integrations/gitlab", gitlabRouter);
app.use("/api/v1/integrations/email", emailRouter);
app.use("/api/v1", integrationRouter) // New Integration route
app.use("/api/v1", analysisRouter);
app.use("/api/v1", systemRouter);
app.use("/api/v1", fraudDictation);
app.use('/api/v1', passwordResetRouter);
app.use("/api/v1", pdfRoutes); // New  pdf file generation route
app.use("/api/v1", ticketRoutes); // New  ticket management route

app.use("/api/v1", intelRouter); // New  intel file generation route
app.use("/api/v1", escalateRouter); // New  escalate management route
app.use("/api/v1", playbookRouter); // New  playbook management route
app.use("/api/v1", imsRouter); // New  IMS management route
app.use("/api/v1", sendMailerRouter); // New  IMS management route
app.use("/api/v1",incidentStatusEmailrouter) // New incidentStats route 
app.use("/api/v1",postmortemRouter) // New Postmortum route
app.use("/api/v1/pricing",pricingRouter)
app.use("/api/v1/customer", customerAuthRoutes); // Route for customer auth route
app.use("/api/v1/customer", customerIncidentRoutes); // Route for  customer incident route
app.use("/api/v1", oncallRouter); // Route for testing email sending
app.use("/api/v1/mocktest", contactusRouter); // Route for testing email sending
app.use("/api/v1/organization", organizationRoutes)

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: "OK", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error:any) {
    res.status(500).json({ 
      status: "ERROR", 
      database: "disconnected",
      error: error.message 
    });
  }
});
// Add password reset routes
// app.use('/api/v1/auth', passwordResetRoutes.getRouter());

// app.use((err: Error, req: express.Request, res: express.Response) => {
  //   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  //   res.status(statusCode).json({
    //     success: false,
    //     error: 'Internal server error'
    //   });
    // });
    
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running token cleanup job...');
    await cleanupService.cleanupExpiredTokens();
  });
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    errorHandler(err, req, res, next);
  }
);

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


  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`🔌 Socket.io available at /api/v1/incident-ticket/conversation`);
  }); 