// src/middleware/ipMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { IPConverter } from '../../common/utils/ipUtils';
import { isIPv4, isIPv6 } from 'net';

declare global {
  namespace Express {
    interface Request {
      clientIp?: string;
      convertedIp?: string;
    }
  }
}

export const ipConversionMiddleware = (
  targetVersion: 4 | 6 = 4
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get client IP considering proxies
      const clientIp = getClientIp(req);
      
      if (!clientIp) {
        return res.status(400).json({ error: 'Could not determine IP address' });
      }

      req.clientIp = clientIp;
      req.convertedIp = IPConverter.normalizeIP(clientIp, targetVersion) || clientIp;

      next();
    } catch (error) {
      console.error('IP Conversion Error:', error);
      next(error);
    }
  };
};

// Enhanced IP detection with proxy support
function getClientIp(req: Request): string | null {
  const headers = [
    'x-client-ip',          // Custom header
    'x-forwarded-for',      // Standard proxy header
    'cf-connecting-ip',     // Cloudflare
    'fastly-client-ip',     // Fastly
    'true-client-ip',       // Akamai
    'x-real-ip',            // Nginx
    'x-cluster-client-ip',  // Rackspace LB
  ];

  for (const header of headers) {
    const value = req.headers[header];
    if (typeof value === 'string') {
      const ips = value.split(',').map(ip => ip.trim());
      const validIp = ips.find(ip => isIPv4(ip) || isIPv6(ip));
      if (validIp) return validIp;
    }
  }

  return req.socket.remoteAddress || null;
}