import { Request, Response } from 'express';
import { CustomerAuthService } from '../services/customerAuthServices';
import { customerLoginSchema, customerRegisterSchema, ApiResponse } from '../types';



export class CustomerAuthController {
  static async register(req: Request, res: Response) {
    try {
      const result = await CustomerAuthService.registerCustomer(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error during registration',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await CustomerAuthService.loginCustomer(req.body);
      
      if (result.success) {
        req.customer =   result.data?.customer as unknown as any;
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error during login',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  static async getProfile(req: any, res: Response) {
    try {
      const result = await CustomerAuthService.getCustomerProfile(req.customer.id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error retrieving profile',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  static async getCompanies(req: Request, res: Response) {
    try {
      const result = await CustomerAuthService.getCompanyUsers();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error retrieving companies',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // Add to CustomerAuthController
static async getOrganizationCustomers(req: any, res: Response) {
  try {
    // For organization users to see their customers
    const companyUserId = req.user?.id || req.query.companyUserId;
    
    if (!companyUserId) {
      const response: ApiResponse = {
        success: false,
        message: 'Company user ID is required'
      };
      return res.status(400).json(response);
    }

    const result = await CustomerAuthService.getOrganizationCustomers(companyUserId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error retrieving organization customers',
      error: error.message
    };
    res.status(500).json(response);
  }
}
}