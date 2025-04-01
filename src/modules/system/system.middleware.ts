// src/modules/system/system.middleware.ts
import { Request, Response, NextFunction } from 'express';
// import { type PrismaClient }  from "@prisma/client";
// import { SystemService } from './system.service';
// import { logger } from '../../common/logger/logger';

// // const prisma = new PrismaClient();
// const systemService = new SystemService();

// interface RateLimitConfig {
//   points: number;       // Max allowed points
//   duration: number;     // Time window in seconds
//   blockDuration: number; // Block duration in seconds
// }

// class PrismaRateLimiter {
//   private config: RateLimitConfig;

//   constructor(config: RateLimitConfig) {
//     this.config = config;
//   }

//   async consume(ip: string): Promise<void> {
//     return prisma.$transaction(async (tx: { rateLimit: { deleteMany: (arg0: { where: { createdAt: { lt: Date; }; }; }) => any; upsert: (arg0: { where: { ip: string; }; update: { points: { increment: number; }; createdAt: { set: Date; }; }; create: { ip: string; points: number; createdAt: Date; blockedUntil: null; }; select: { points: boolean; blockedUntil: boolean; }; }) => any; update: (arg0: { where: { ip: string; }; data: { blockedUntil: Date; points: number; }; }) => any; }; }) => {
//       const now = Math.floor(Date.now() / 1000);
//       const windowStart = now - this.config.duration;

//       // Cleanup old entries
//       await tx.rateLimit.deleteMany({
//         where: { createdAt: { lt: new Date(windowStart * 1000) } }
//       });

//       const entry = await tx.rateLimit.upsert({
//         where: { ip },
//         update: {
//           points: { increment: 1 },
//           createdAt: { set: new Date(now * 1000) }
//         },
//         create: {
//           ip,
//           points: 1,
//           createdAt: new Date(now * 1000),
//           blockedUntil: null
//         },
//         select: { points: true, blockedUntil: true }
//       });

//       // Check block status
//       if (entry.blockedUntil && entry.blockedUntil > new Date()) {
//         throw this.createRateLimitError('IP blocked', 429);
//       }

//       // Check point limits
//       if (entry.points > this.config.points) {
//         await tx.rateLimit.update({
//           where: { ip },
//           data: { 
//             blockedUntil: new Date((now + this.config.blockDuration) * 1000),
//             points: 0
//           }
//         });
        
//         throw this.createRateLimitError(
//           'Too many requests', 
//           429,
//           this.config.blockDuration
//         );
//       }
//     });
//   }

//   private createRateLimitError(message: string, status: number, retryAfter?: number) {
//     const error = new Error(message);
//     (error as any).statusCode = status;
//     (error as any).retryAfter = retryAfter;
//     return error;
//   }
// }

// // Configure rate limits
// export const systemRateLimiter = new PrismaRateLimiter({
//   points: 10,
//   duration: 60,
//   blockDuration: 300
// });

// export const rateLimiterMiddleware = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const ip = systemService.getClientIp(req);
//     await systemRateLimiter.consume(ip);
//     next();
//   } catch (error:any) {
//     if (error.statusCode === 429) {
//       res
//         .status(429)
//         .set('Retry-After', error.retryAfter)
//         .json({
//           success: false,
//           error: 'Too many requests. Please try again later.'
//         });
//     } else {
//       logger.error('Rate limit error:', error);
//       next(error);
//     }
//   }
// };

export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res
    .set('X-Content-Type-Options', 'nosniff')
    .set('X-Frame-Options', 'DENY')
    .set('X-XSS-Protection', '1; mode=block')
    .set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  next();
};