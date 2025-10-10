"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAuthService = void 0;
const prisma_1 = require("../../../lib/prisma");
const jwt_1 = require("../utils/jwt");
const password_1 = require("../utils/password");
class CustomerAuthService {
    static async registerCustomer(data) {
        try {
            // Check if customer already exists
            const existingCustomer = await prisma_1.prisma.endCustomer.findUnique({
                where: { contactEmail: data.email }
            });
            if (existingCustomer) {
                return {
                    success: false,
                    message: 'Customer already exists with this email'
                };
            }
            // Verify the company user (Flutterwave) exists
            const companyUser = await prisma_1.prisma.user.findUnique({
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
            const hashedPassword = await password_1.PasswordUtils.hashPassword(data.password);
            const customer = await prisma_1.prisma.endCustomer.create({
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
            const token = jwt_1.JWTUtils.generateCustomerToken({
                id: customer.id,
                email: customer.contactEmail,
                companyUserId: customer.companyUserId,
                name: customer.name
            });
            return {
                success: true,
                message: 'Customer registered successfully',
                data: {
                    token,
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        contactEmail: customer.contactEmail,
                        companyUserId: customer.companyUserId,
                        isActive: customer.isActive,
                        isVerified: customer.isVerified,
                        createdAt: customer.createdAt,
                        updatedAt: customer.updatedAt
                    }
                }
            };
        }
        catch (error) {
            console.error('Customer registration error:', error);
            return {
                success: false,
                message: 'Registration failed',
                error: error.message
            };
        }
    }
    static async loginCustomer(data) {
        try {
            // Find customer by email
            const customer = await prisma_1.prisma.endCustomer.findUnique({
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
            const isPasswordValid = await password_1.PasswordUtils.comparePassword(data.password, customer.passwordHash);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            const token = jwt_1.JWTUtils.generateCustomerToken({
                id: customer.id,
                email: customer.contactEmail,
                companyUserId: customer.companyUserId,
                name: customer.name
            });
            // Update last login
            await prisma_1.prisma.endCustomer.update({
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
                        name: customer.name,
                        contactEmail: customer.contactEmail,
                        companyUserId: customer.companyUserId,
                        isActive: customer.isActive,
                        isVerified: customer.isVerified,
                        createdAt: customer.createdAt,
                        updatedAt: customer.updatedAt
                    }
                }
            };
        }
        catch (error) {
            console.error('Customer login error:', error);
            return {
                success: false,
                message: 'Login failed',
                error: error.message
            };
        }
    }
    static async getCustomerProfile(customerId) {
        try {
            const customer = await prisma_1.prisma.endCustomer.findUnique({
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
                    name: customer.name,
                    contactEmail: customer.contactEmail,
                    companyUserId: customer.companyUserId,
                    isActive: customer.isActive,
                    isVerified: customer.isVerified,
                    createdAt: customer.createdAt,
                    updatedAt: customer.updatedAt
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to retrieve profile',
                error: error.message
            };
        }
    }
    static async getCompanyUsers() {
        try {
            // Get all active users who have businesses (companies like Flutterwave)
            const companyUsers = await prisma_1.prisma.user.findMany({
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
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to retrieve companies',
                error: error.message
            };
        }
    }
    // Add to CustomerAuthService
    static async getOrganizationCustomers(companyUserId) {
        try {
            // Verify the company user exists
            const companyUser = await prisma_1.prisma.user.findUnique({
                where: {
                    id: companyUserId,
                    // isActive: true 
                },
                include: {
                    business: true
                }
            });
            if (!companyUser) {
                return {
                    success: false,
                    message: 'Company not found'
                };
            }
            // Get all customers under this organization
            const customers = await prisma_1.prisma.endCustomer.findMany({
                where: {
                    companyUserId: companyUserId,
                    // isActive: true 
                },
                include: {
                    // Include incident counts for dashboard
                    incidents: {
                        select: {
                            id: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            // Format the response with useful stats
            const formattedCustomers = customers.map(customer => ({
                id: customer.id,
                name: customer.name,
                contactEmail: customer.contactEmail,
                isActive: customer.isActive,
                isVerified: customer.isVerified,
                lastLogin: customer.lastLogin,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt,
                totalIncidents: customer.incidents.length,
                openIncidents: customer.incidents.filter(inc => inc.status === 'OPEN').length,
                resolvedIncidents: customer.incidents.filter(inc => inc.status === 'RESOLVED' || inc.status === 'CLOSED').length
            }));
            return {
                success: true,
                message: 'Organization customers retrieved successfully',
                data: {
                    company: {
                        id: companyUser.id,
                        name: `${companyUser.firstName} ${companyUser.lastName}`.trim(),
                        business: companyUser.business ? {
                            name: companyUser.business.name,
                            industry: companyUser.business.industry
                        } : null
                    },
                    customers: formattedCustomers,
                    stats: {
                        totalCustomers: formattedCustomers.length,
                        activeCustomers: formattedCustomers.filter(c => c.isActive).length,
                        totalIncidents: formattedCustomers.reduce((sum, customer) => sum + customer.totalIncidents, 0)
                    }
                }
            };
        }
        catch (error) {
            console.error('Get organization customers error:', error);
            return {
                success: false,
                message: 'Failed to retrieve organization customers',
                error: error.message
            };
        }
    }
}
exports.CustomerAuthService = CustomerAuthService;
