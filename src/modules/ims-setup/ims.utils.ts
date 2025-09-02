// import { InviteMemberRequest } from './types';

/**
 * Generate a unique ticket ID for incidents
 */
export const generateTicketId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `TKT-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * Generate a random string for various purposes
 */
export const generateRandomString = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script.*?>.*?<\/script>/gi, '');
};

/**
 * Format validation errors for response
 */
export const formatValidationErrors = (errors: string[]): string => {
  return errors.join(', ');
};

/**
 * Calculate user level based on role and permissions
 */
export const calculateUserLevel = (
  role: string, 
  permissions: string[]
): string => {
  const roleWeights: { [key: string]: number } = {
    'ADMIN': 4,
    'MANAGER': 3,
    'ANALYST': 2,
    'USER': 1,
    'VIEWER': 0
  };

  const permissionWeights: { [key: string]: number } = {
    'MANAGE_USERS': 3,
    'EXECUTE_ACTIONS': 2,
    'MODIFY_DASHBOARD': 1,
    'VIEW_DASHBOARD': 0
  };

  const baseLevel = roleWeights[role] || 0;
  const permissionBonus = permissions.reduce((sum, perm) => 
    sum + (permissionWeights[perm] || 0), 0
  );

  const total = baseLevel + (permissionBonus * 0.1);
  return Math.min(Math.max(total, 1), 5).toFixed(1);
};