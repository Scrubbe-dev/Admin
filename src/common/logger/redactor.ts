import { format } from 'winston';

type IField = {
    value: string; 
    index: number;
     array: string[]
}

const sensitiveFields = [
  'password',
  'authorization',
  'token',
  'apiKey',
  'creditCard',
];

export const redactSensitiveData = format((info) => {
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