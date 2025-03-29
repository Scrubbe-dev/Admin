// src/common/logger/logger.ts
import winston, { Logger as WinstonLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../../config/env';
import { redactSensitiveData } from './redactor';
import { Request, Response } from 'express';

const { combine, timestamp, printf, errors, metadata } = format;
const SERVICE_NAME = 'scrubbe-dev';

class Logger {
  private static instance: WinstonLogger;
  private static requestLogFormat = printf(
    ({ level, message, timestamp, metadata }) => {
    return `${timestamp} [${level}] ${message} - ${JSON.stringify(metadata)}`;
  });

  private static getFormat() {
    return combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      errors({ stack: true }),
      metadata({ fillWith: ['service', 'environment', 'correlationId'] }),
      format(redactSensitiveData as any)(),
      env.NODE_ENV === 'production'
        ? format.json()
        : combine(format.colorize(), this.requestLogFormat)
    );
  }

  private static createFileTransport() {
    return new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      auditFile: 'logs/.audit.json',
      format: this.getFormat(),
      level: 'http',
    });
  }

  private static createConsoleTransport() {
    return new transports.Console({
      format: this.getFormat(),
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    });
  }

  public static configure(): WinstonLogger {
    if (!Logger.instance) {
      const transports = [
        this.createConsoleTransport(),
        ...(env.NODE_ENV !== 'test' ? [this.createFileTransport()] : []),
      ];

      Logger.instance = winston.createLogger({
        levels: winston.config.syslog.levels,
        defaultMeta: {
          service: SERVICE_NAME,
          environment: env.NODE_ENV,
        },
        transports,
        exitOnError: false,
      });

      this.configureProcessHandlers();
    }

    return Logger.instance;
  }

  private static configureProcessHandlers() {
    process
      .on('unhandledRejection', (reason) => {
        Logger.instance.error('Unhandled Rejection', {
          error: reason,
          context: 'process',
        });
      })
      .on('uncaughtException', (error) => {
        Logger.instance.error('Uncaught Exception', {
          error: error.message,
          stack: error.stack,
          context: 'process',
        });
        process.exit(1);
      });
  }

  public static httpLogger() {
    return (req: Request, res: Response, next: () => void) => {
      const start = Date.now();
      const { method, originalUrl, ip, headers } = req;

      res.on('finish', () => {
        const duration = Date.now() - start;
        const meta = {
          method,
          url: originalUrl,
          status: res.statusCode,
          duration,
          ip,
          userAgent: headers['user-agent'],
          correlationId: req.headers['x-correlation-id'],
        };

        if (res.statusCode >= 500) {
          Logger.instance.error(`${method} ${originalUrl}`, meta);
        } else if (res.statusCode >= 400) {
          Logger.instance.warn(`${method} ${originalUrl}`, meta);
        } else {
          Logger.instance.http(`${method} ${originalUrl}`, meta);
        }
      });

      next();
    };
  }

  public static child(meta: Record<string, unknown>) {
    return Logger.instance.child(meta);
  }
}

// Initialize logger instance
export const logger = Logger.configure();

// // Example child logger for specific modules
// export const authLogger = Logger.child({ module: 'authentication' });
// export const fraudLogger = Logger.child({ module: 'fraud-detection' });