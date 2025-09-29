
import {prisma} from '../../../lib/prisma';
import {  JWTUtils } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import { CustomerLoginInput, CustomerRegisterInput, ApiResponse, Customer } from '../types';


export class CustomerAuthService {
  static async registerCustomer(data: CustomerRegisterInput): Promise<ApiResponse<{ token: string; customer: Customer }>> {
    try {
      // Check if customer already exists
      const existingCustomer = await prisma.endCustomer.findUnique({
        where: { contactEmail: data.email }
      });

      if (existingCustomer) {
        return {
          success: false,
          message: 'Customer already exists with this email'
        };
      }

      // Verify the company user (Flutterwave) exists
      const companyUser = await prisma.user.findUnique({
        where: { 
          id: data.companyUserId,
        },
        include: {
          business: true
        }
      });

      if (!companyUser) {
        return {
          success: false,
          message: 'Company not found or inactive'
        };
      }

      // Verify company name matches
      // if (!companyUser.business || companyUser.business.name !== data.companyName) {
      //   return {
      //     success: false,
      //     message: 'Company name does not match our records'
      //   };
      // }

      // Create customer associated with the company user
      const hashedPassword = await PasswordUtils.hashPassword(data.password);
      
      const customer = await prisma.endCustomer.create({
        data: {
          name: `${data.fullName}/${companyUser.business?.name || 'NoCompany'}`,
          contactEmail: data.email,
          tenantId: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          companyUserId: data.companyUserId,
          passwordHash: hashedPassword,
          isVerified: true, // Auto-verify for now, can add email verification later
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const token = JWTUtils.generateCustomerToken({
        id: customer.id,
        email: customer.contactEmail,
        companyUserId: customer.companyUserId,
        name: customer.name!
      });

      return {
        success: true,
        message: 'Customer registered successfully',
        data: {
          token,
          customer: {
            id: customer.id,
            name: customer.name!,
            contactEmail: customer.contactEmail,
            companyUserId: customer.companyUserId,
            isActive: customer.isActive,
            isVerified: customer.isVerified,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt
          }
        }
      };

    } catch (error: any) {
      console.error('Customer registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
        error: error.message
      };
    }
  }

  static async loginCustomer(data: CustomerLoginInput): Promise<ApiResponse<{ token: string; customer: Customer }>> {
    try {
      // Find customer by email
      const customer = await prisma.endCustomer.findUnique({
        where: { 
          contactEmail: data.email,
          // isActive: true 
        },
        include: {
          companyUser: {
            include: {
              business: true
            }
          }
        }
      });

      if (!customer) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      if (!customer.passwordHash) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(data.password, customer.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      const token = JWTUtils.generateCustomerToken({
        id: customer.id,
        email: customer.contactEmail,
        companyUserId: customer.companyUserId,
        name: customer.name!
      });

      // Update last login
      await prisma.endCustomer.update({
        where: { id: customer.id },
        data: { lastLogin: new Date() }
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          token,
          customer: {
            id: customer.id,
            name: customer.name!,
            contactEmail: customer.contactEmail,
            companyUserId: customer.companyUserId,
            isActive: customer.isActive,
            isVerified: customer.isVerified,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt
          }
        }
      };

    } catch (error: any) {
      console.error('Customer login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: error.message
      };
    }
  }

  static async getCustomerProfile(customerId: string): Promise<ApiResponse<Customer>> {
    try {
      const customer = await prisma.endCustomer.findUnique({
        where: { 
          id: customerId,
          // isActive: true 
        },
        include: {
          companyUser: {
            include: {
              business: true
            }
          }
        }
      });

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found'
        };
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: customer.id,
          name: customer.name!,
          contactEmail: customer.contactEmail,
          companyUserId: customer.companyUserId,
          isActive: customer.isActive,
          isVerified: customer.isVerified,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to retrieve profile',
        error: error.message
      };
    }
  }

  static async getCompanyUsers(): Promise<ApiResponse<Array<{ id: string; name: string; business: { name: string } }>> | any> {
    try {
      // Get all active users who have businesses (companies like Flutterwave)
      const companyUsers = await prisma.user.findMany({
        where: {
          // isActive: true,
          business: {
            isNot: null
          }
        },
        include: {
          business: {
            select: {
              id: true,
              name: true
            }
          },
          Customer: true
        },
        orderBy: {
          business: {
            name: 'asc'
          }
        }
      });

      const formattedCompanies = companyUsers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        business: {
          name: user.business?.name ?? ''
        }
      }));

      return {
        success: true,
        message: 'Companies retrieved successfully',
        data: formattedCompanies
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to retrieve companies',
        error: error.message
      };
    }
  }
}