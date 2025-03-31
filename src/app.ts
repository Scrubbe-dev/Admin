// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import systemRouter from './modules/system/system.routes';
import { config } from 'dotenv';
import { setupSwagger } from "./config/swagger";
config()

const app = express();

app.use(express.json());
setupSwagger(app);

app.set('trust proxy', (ip: string) => {
  if (ip === '127.0.0.1' || ip === '::1') return true;
  return env.NODE_ENV === 'production' ? 2 : false;
});

// Security middleware

app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use('/api/v1', systemRouter);

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