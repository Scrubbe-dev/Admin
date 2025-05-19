import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import systemRouter from './modules/system/system.routes';
import { config as dotenvConfig } from 'dotenv';
import { setupSwagger } from "./config/swagger";
import analysisRouter from './modules/bec/bec.routes';
import fraudDictation from './modules/digitalpaymentfraud/fraud.route'
import apikeyRoute from './modules/apikey/apikey.route'

// for auth 
import { PrismaClient } from '@prisma/client';
import { createAuthRouter } from './modules/auth/routes/auth.routes';
import { AuthService } from './modules/auth/services/auth.service';
import { TokenService } from './modules/auth/services/token.service';
import { EmailServices } from './modules/password-reset/email.services';
import { SecurityUtils } from './modules/auth/utils/security.utils';
import { AuthMiddleware } from './modules/auth/middleware/auth.middleware';
import { AuthController } from './modules/auth/controllers/auth.controller';
// import { EmailServices } from './modules/password-reset/email.services';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// waiting and admin 
import waitingRouter from './modules/waitingmessage/waiting.route';
import adminRouter from './modules/admin-auth/admin.route';

// Import password reset components
import { PasswordResetService } from './modules/password-reset/reset.services';
import { PasswordResetController } from './modules/password-reset/reset.controller';
import { PasswordResetMiddleware } from './modules/password-reset/reset.middleware';
import { PasswordResetRoutes } from './modules/password-reset/reset.route';
import { Logger } from './modules/password-reset/utils/logger';
import { RateLimiterService } from './modules/password-reset/utils/rate-limiter';
dotenvConfig()

const app = express();
const prisma = new PrismaClient();

app.set('trust proxy', (ip: string) => {
  if (ip === '127.0.0.1' || ip === '::1') return true;
  return env.NODE_ENV === 'production' ? 2 : false;
});

// Configuration
const config = {
  jwtSecret: env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: '15m',
  refreshTokenExpiresInDays: 7,
  smtpOptions: {
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || '587'),
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  },
  fromEmail: env.FROM_EMAIL || 'no-reply@yourdomain.com',
};

// Initialize logger
const logger = new Logger('PasswordReset');

// Initialize rate limiter
const rateLimiter = new RateLimiterService();

// Initialize services
const securityUtils = new SecurityUtils();
const tokenService = new TokenService(
  prisma,
  config.jwtSecret,
  config.jwtExpiresIn,
  config.refreshTokenExpiresInDays
);
const emailService = new EmailServices();
const authService = new AuthService(prisma, tokenService, securityUtils);
const authMiddleware = new AuthMiddleware(tokenService);
const authController = new AuthController(authService);
console.log(__dirname, "CURRENT DIRECTORY NAME")
// Initialize password reset services
// const PasswordEmailServices =  new EmailService
const passwordResetService = new PasswordResetService(prisma, emailService, logger);
const passwordResetMiddleware = new PasswordResetMiddleware(passwordResetService, logger, rateLimiter);
const passwordResetController = new PasswordResetController(passwordResetService, logger);
const passwordResetRoutes = new PasswordResetRoutes(passwordResetController, passwordResetMiddleware);

// Middleware
app.use(cors({
  origin:"*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(morgan('combined'));
app.use(helmet());
app.use(express.json());
setupSwagger(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/v1', waitingRouter);
app.use('/api/v1', adminRouter);
app.use('/api/v1', createAuthRouter(authController, authMiddleware));
app.use('/api/v1', analysisRouter);
app.use('/api/v1', systemRouter);
app.use('/api/v1', fraudDictation);
app.use('/api/v1', apikeyRoute);
app.use('/api/v1', passwordResetRoutes.getRouter())

// Add password reset routes
// app.use('/api/v1/auth', passwordResetRoutes.getRouter());

app.use((err: Error, req: express.Request, res: express.Response) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
