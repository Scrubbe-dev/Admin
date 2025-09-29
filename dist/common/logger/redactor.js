"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactSensitiveData = void 0;
const winston_1 = require("winston");
const sensitiveFields = [
    'password',
    'authorization',
    'token',
    'apiKey',
    'creditCard',
];
exports.redactSensitiveData = (0, winston_1.format)((info) => {
    const redacted = { ...info };
    sensitiveFields.forEach((field) => {
        if (redacted[field]) {
            redacted[field] = '***REDACTED***';
        }
        // if (redacted.metadata?.[field]) {
        //   redacted.metadata[field]  = '***REDACTED***';
        // }
    });
    return redacted;
});
