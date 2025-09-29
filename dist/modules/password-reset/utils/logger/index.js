"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Logger utility for application-wide logging
 */
class Logger {
    context;
    constructor(context = 'App') {
        this.context = context;
    }
    /**
     * Logs informational messages
     * @param message Main message to log
     * @param meta Additional metadata to include
     */
    info(message, meta) {
        this.log('INFO', message, meta);
    }
    /**
     * Logs warning messages
     * @param message Warning message to log
     * @param meta Additional metadata to include
     */
    warn(message, meta) {
        this.log('WARN', message, meta);
    }
    /**
     * Logs error messages
     * @param message Error message to log
     * @param error Error object or additional error details
     */
    error(message, error) {
        this.log('ERROR', message, error);
    }
    /**
     * Logs debug messages
     * @param message Debug message to log
     * @param meta Additional metadata to include
     */
    debug(message, meta) {
        this.log('DEBUG', message, meta);
    }
    /**
     * Internal method to handle the actual logging
     * @param level Log level
     * @param message Message to log
     * @param meta Additional metadata
     */
    log(level, message, meta) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            context: this.context,
            message,
            ...(meta ? { meta } : {})
        };
        if (level === 'ERROR') {
            console.error(`[${timestamp}] [${level}] [${this.context}] ${message}`, meta || '');
        }
        else if (level === 'WARN') {
            console.warn(`[${timestamp}] [${level}] [${this.context}] ${message}`, meta || '');
        }
        else if (level === 'DEBUG') {
            console.debug(`[${timestamp}] [${level}] [${this.context}] ${message}`, meta || '');
        }
        else {
            console.log(`[${timestamp}] [${level}] [${this.context}] ${message}`, meta || '');
        }
    }
}
exports.Logger = Logger;
