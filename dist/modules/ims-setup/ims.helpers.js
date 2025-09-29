"use strict";
/**
 * Utility functions for the IMS application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUUID = exports.delay = exports.safeJsonStringify = exports.safeJsonParse = exports.generateRandomColor = exports.formatDate = exports.capitalize = exports.isEmpty = exports.deepClone = exports.throttle = exports.debounce = exports.formatBytes = exports.sanitizeInput = exports.isValidEmail = exports.slugify = exports.generateSecureToken = exports.generateUniqueId = exports.generateRandomString = void 0;
/**
 * Generate a random string of specified length
 * @param length - Length of the random string (default: 12)
 * @returns Random string
 */
const generateRandomString = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    // Use crypto.getRandomValues for better randomness if available
    if (typeof window !== 'undefined' && window.crypto) {
        const randomValues = new Uint8Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
    }
    else if (typeof require !== 'undefined') {
        // Node.js environment
        try {
            const crypto = require('crypto');
            const randomBytes = crypto.randomBytes(length);
            for (let i = 0; i < length; i++) {
                result += chars[randomBytes[i] % chars.length];
            }
        }
        catch {
            // Fallback to Math.random if crypto is not available
            for (let i = 0; i < length; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
        }
    }
    else {
        // Fallback for browsers without crypto support
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
    }
    return result;
};
exports.generateRandomString = generateRandomString;
/**
 * Generate a unique ID with prefix
 * @param prefix - Prefix for the ID (default: 'ID')
 * @returns Unique ID string
 */
const generateUniqueId = (prefix = 'ID') => {
    const timestamp = Date.now().toString(36);
    const randomStr = (0, exports.generateRandomString)(6);
    return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
};
exports.generateUniqueId = generateUniqueId;
/**
 * Generate a secure random token
 * @param length - Token length (default: 32)
 * @returns Secure random token
 */
const generateSecureToken = (length = 32) => {
    return (0, exports.generateRandomString)(length);
};
exports.generateSecureToken = generateSecureToken;
/**
 * Slugify a string for URLs or identifiers
 * @param text - Text to slugify
 * @returns Slugified string
 */
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
};
exports.slugify = slugify;
/**
 * Validate email format
 * @param email - Email address to validate
 * @returns Boolean indicating if email is valid
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Sanitize user input to prevent XSS
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string')
        return '';
    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
};
exports.sanitizeInput = sanitizeInput;
/**
 * Format bytes to human readable format
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};
exports.formatBytes = formatBytes;
/**
 * Debounce function for limiting frequent calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(null, args), wait);
    };
};
exports.debounce = debounce;
/**
 * Throttle function for limiting call frequency
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};
exports.throttle = throttle;
/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => (0, exports.deepClone)(item));
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = (0, exports.deepClone)(obj[key]);
            }
        }
        return cloned;
    }
    return obj;
};
exports.deepClone = deepClone;
/**
 * Check if object is empty
 * @param obj - Object to check
 * @returns Boolean indicating if object is empty
 */
const isEmpty = (obj) => {
    if (obj == null)
        return true;
    if (Array.isArray(obj))
        return obj.length === 0;
    if (typeof obj === 'object')
        return Object.keys(obj).length === 0;
    if (typeof obj === 'string')
        return obj.trim().length === 0;
    return false;
};
exports.isEmpty = isEmpty;
/**
 * Capitalize first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
const capitalize = (str) => {
    if (!str)
        return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
exports.capitalize = capitalize;
/**
 * Format date to readable string
 * @param date - Date object or string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
const formatDate = (date, options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
}) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};
exports.formatDate = formatDate;
/**
 * Generate a random color hex code
 * @returns Random color hex code
 */
const generateRandomColor = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};
exports.generateRandomColor = generateRandomColor;
/**
 * Parse JSON safely
 * @param str - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
const safeJsonParse = (str, defaultValue = null) => {
    try {
        return JSON.parse(str);
    }
    catch {
        return defaultValue;
    }
};
exports.safeJsonParse = safeJsonParse;
/**
 * Stringify JSON safely
 * @param obj - Object to stringify
 * @returns JSON string or empty string
 */
const safeJsonStringify = (obj) => {
    try {
        return JSON.stringify(obj);
    }
    catch {
        return '';
    }
};
exports.safeJsonStringify = safeJsonStringify;
/**
 * Delay execution for specified time
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.delay = delay;
/**
 * Generate a UUID v4
 * @returns UUID string
 */
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
exports.generateUUID = generateUUID;
exports.default = {
    generateRandomString: exports.generateRandomString,
    generateUniqueId: exports.generateUniqueId,
    generateSecureToken: exports.generateSecureToken,
    slugify: exports.slugify,
    isValidEmail: exports.isValidEmail,
    sanitizeInput: exports.sanitizeInput,
    formatBytes: exports.formatBytes,
    debounce: exports.debounce,
    throttle: exports.throttle,
    deepClone: exports.deepClone,
    isEmpty: exports.isEmpty,
    capitalize: exports.capitalize,
    formatDate: exports.formatDate,
    generateRandomColor: exports.generateRandomColor,
    safeJsonParse: exports.safeJsonParse,
    safeJsonStringify: exports.safeJsonStringify,
    delay: exports.delay,
    generateUUID: exports.generateUUID
};
