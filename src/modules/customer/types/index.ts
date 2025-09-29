import { IncidentStatus } from '@prisma/client';
import { z } from 'zod';

// Auth Types
export const customerLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

export const customerRegisterSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }),
  companyName: z.string().min(1, { message: "Company name is required" }).optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  companyUserId: z.string().uuid({ message: "Valid company user ID is required" }) // The User (Flutterwave) they're registering for
});

// Customer Portal Incident Types
export const createCustomerIncidentSchema = z.object({
  shortDescription: z.string().min(1, { message: "Short description is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  category: z.string().min(1, { message: "Category is required" })
});

export const getCustomerIncidentsSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional()
});

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type CreateCustomerIncidentInput = z.infer<typeof createCustomerIncidentSchema>;
export type GetCustomerIncidentsInput = z.infer<typeof getCustomerIncidentsSchema>;

declare global {
  namespace Express {
    interface Request {
    customer: {
        id: string;
        email: string;
        companyUserId: string; // The User (Flutterwave) this customer belongs to
        name: string;
    };
  }
}
}


export interface AuthRequest extends Express.Request {
  customer: {
    id: string;
    email: string;
    companyUserId: string; // The User (Flutterwave) this customer belongs to
    name: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}





























// types.ts

export interface Customer {
  id: string;
  name: string;
  contactEmail: string;
  companyUserId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerIncident {
  id: string;
  ticketNumber: string;
  shortDescription: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  category: string;
  status: IncidentStatus;
  customerId: string;
  companyUserId: string;
  businessId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  customer: Customer;
  comments?: CustomerIncidentComment[];
  attachments?: CustomerIncidentAttachment[];
  _count: {
    comments: number;
    attachments: number;
  };
}

export interface CustomerIncidentComment {
  id: string;
  content: string;
  authorType: "CUSTOMER" | "USER";
  authorId: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerIncidentAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
}