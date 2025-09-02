/**
 * Utility functions for the IMS application
 */

/**
 * Generate a random string of specified length
 * @param length - Length of the random string (default: 12)
 * @returns Random string
 */
export const generateRandomString = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues for better randomness if available
  if (typeof window !== 'undefined' && window.crypto) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    try {
      const crypto = require('crypto');
      const randomBytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
      }
    } catch {
      // Fallback to Math.random if crypto is not available
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
  } else {
    // Fallback for browsers without crypto support
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
};

/**
 * Generate a unique ID with prefix
 * @param prefix - Prefix for the ID (default: 'ID')
 * @returns Unique ID string
 */
export const generateUniqueId = (prefix: string = 'ID'): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = generateRandomString(6);
  return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * Generate a secure random token
 * @param length - Token length (default: 32)
 * @returns Secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return generateRandomString(length);
};

/**
 * Slugify a string for URLs or identifiers
 * @param text - Text to slugify
 * @returns Slugified string
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns Boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize user input to prevent XSS
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

/**
 * Format bytes to human readable format
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Debounce function for limiting frequent calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

/**
 * Throttle function for limiting call frequency
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
};

/**
 * Check if object is empty
 * @param obj - Object to check
 * @returns Boolean indicating if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

/**
 * Capitalize first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format date to readable string
 * @param date - Date object or string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Generate a random color hex code
 * @returns Random color hex code
 */
export const generateRandomColor = (): string => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Parse JSON safely
 * @param str - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export const safeJsonParse = <T>(str: string, defaultValue: T = null as T): T => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

/**
 * Stringify JSON safely
 * @param obj - Object to stringify
 * @returns JSON string or empty string
 */
export const safeJsonStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return '';
  }
};

/**
 * Delay execution for specified time
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate a UUID v4
 * @returns UUID string
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default {
  generateRandomString,
  generateUniqueId,
  generateSecureToken,
  slugify,
  isValidEmail,
  sanitizeInput,
  formatBytes,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  capitalize,
  formatDate,
  generateRandomColor,
  safeJsonParse,
  safeJsonStringify,
  delay,
  generateUUID
};