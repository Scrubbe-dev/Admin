// src/modules/system/system.routes.ts
import { Router } from 'express';
import {
  rateLimiterMiddleware,
  securityHeadersMiddleware
} from './system.middleware';
import { getSystemInfoHandler } from './system.controller';

const router = Router();

router.get(
  '/system-info',
  securityHeadersMiddleware,
  // rateLimiterMiddleware,
  getSystemInfoHandler
);

export default router;