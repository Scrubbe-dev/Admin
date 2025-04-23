// src/app.ts
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
import { EmailService } from './modules/auth/services/email.service';
import { SecurityUtils } from './modules/auth/utils/security.utils';
import { AuthMiddleware } from './modules/auth/middleware/auth.middleware';
import { AuthController } from './modules/auth/controllers/auth.controller';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';


// waiting and admin 
import waitingRouter from '../src/modules/waitingmessage/waiting.route';
import adminRouter from '../src/modules/admin-auth/admin.route';

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




// Initialize services
const securityUtils = new SecurityUtils();
const tokenService = new TokenService(
  prisma,
  config.jwtSecret,
  config.jwtExpiresIn,
  config.refreshTokenExpiresInDays
);
const emailService = new EmailService(prisma, config.fromEmail, config.smtpOptions);
const authService = new AuthService(prisma, tokenService, emailService, securityUtils);
const authMiddleware = new AuthMiddleware(tokenService);
const authController = new AuthController(authService);

// Middleware
app.use(morgan('combined'));
app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  methods: ['GET','POST','PUT',"DELETE",'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
setupSwagger(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/v1',createAuthRouter(authController, authMiddleware));
app.use('/api/v1',analysisRouter);
app.use('/api/v1',systemRouter);
app.use('/api/v1',fraudDictation);
app.use('/api/v1',apikeyRoute);
app.use('/api/v1',waitingRouter);
app.use('/api/v1',adminRouter);

// Error handling middleware
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