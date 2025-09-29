"use strict";
// import { InviteMemberRequest } from './types';
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUserLevel = exports.formatValidationErrors = exports.sanitizeInput = exports.isValidEmail = exports.generateRandomString = exports.generateTicketId = void 0;
exports.generateDomain = generateDomain;
exports.extractCompanyNameFromHost = extractCompanyNameFromHost;
/**
 * Generate a unique ticket ID for incidents
 */
const generateTicketId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `TKT-${timestamp}-${randomStr}`.toUpperCase();
};
exports.generateTicketId = generateTicketId;
/**
 * Generate a random string for various purposes
 */
const generateRandomString = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
    return input.trim().replace(/<script.*?>.*?<\/script>/gi, '');
};
exports.sanitizeInput = sanitizeInput;
/**
 * Format validation errors for response
 */
const formatValidationErrors = (errors) => {
    return errors.join(', ');
};
exports.formatValidationErrors = formatValidationErrors;
/**
 * Calculate user level based on role and permissions
 */
const calculateUserLevel = (role, permissions) => {
    const roleWeights = {
        'ADMIN': 4,
        'MANAGER': 3,
        'ANALYST': 2,
        'USER': 1,
        'VIEWER': 0
    };
    const permissionWeights = {
        'MANAGE_USERS': 3,
        'EXECUTE_ACTIONS': 2,
        'MODIFY_DASHBOARD': 1,
        'VIEW_DASHBOARD': 0
    };
    const baseLevel = roleWeights[role] || 0;
    const permissionBonus = permissions.reduce((sum, perm) => sum + (permissionWeights[perm] || 0), 0);
    const total = baseLevel + (permissionBonus * 0.1);
    return Math.min(Math.max(total, 1), 5).toFixed(1);
};
exports.calculateUserLevel = calculateUserLevel;
/**
 * Generates a valid domain name from an input string
 * @param input The input string to convert to a domain
 * @returns A properly formatted domain in the format: [processed-input].incident.scrubbe.com
 */
function generateDomain(input) {
    // Handle empty input
    if (!input || input.trim() === '') {
        return 'default.incident.scrubbe.com';
    }
    // Step 1: Convert to lowercase
    let processed = input.toLowerCase().trim();
    // Step 2: Replace invalid characters with hyphens
    // Keep only: a-z, 0-9, hyphens (but not at start/end)
    processed = processed
        .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    // Step 3: Handle empty result after processing
    if (processed.length === 0) {
        processed = 'default';
    }
    // Step 4: Truncate to max label length (63 characters)
    if (processed.length > 63) {
        processed = processed.substring(0, 63);
        // Ensure we don't end with a hyphen after truncation
        processed = processed.replace(/-$/, '');
    }
    // Step 5: Internationalization support (punycode conversion)
    // This handles non-ASCII characters (e.g., Chinese, Arabic, emojis)
    try {
        // Use the built-in URL API for punycode conversion
        const url = new URL(`http://${processed}.incident.scrubbe.com`);
        const domainParts = url.hostname.split('.');
        processed = domainParts[0]; // Get the processed subdomain part
    }
    catch (error) {
        // Fallback to original processed string if URL parsing fails
        console.warn('Punycode conversion failed, using ASCII fallback:', error);
    }
    // Final domain assembly
    return `${processed}.incident.scrubbe.com`;
}
/**
 * Extracts company name from a subdomain
 * @param host The host header (e.g., 'acme.incident.scrubbe.com')
 * @returns The company name (e.g., 'acme') or null if not found
 */
function extractCompanyNameFromHost(host) {
    if (!host)
        return null;
    // Remove port if present
    const hostname = host.split(':')[0];
    // Check if the host ends with our main domain
    const mainDomain = 'incident.scrubbe.com';
    if (!hostname.endsWith(`.${mainDomain}`) && hostname !== mainDomain) {
        return null;
    }
    // Extract the subdomain part
    const subdomain = hostname.substring(0, hostname.length - mainDomain.length - 1);
    // If the subdomain is empty, return null
    if (!subdomain) {
        return null;
    }
    // Validate the subdomain (same as in generateDomain but without the domain part)
    if (!/^[a-z0-9-]{1,63}$/.test(subdomain)) {
        return null;
    }
    return subdomain;
}
