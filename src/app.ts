// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import systemRouter from './modules/system/system.routes';
import { config } from 'dotenv';
config()

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/v1', systemRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});