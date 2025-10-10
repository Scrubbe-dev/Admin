"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAuthController = void 0;
const customerAuthServices_1 = require("../services/customerAuthServices");
class CustomerAuthController {
    static async register(req, res) {
        try {
            const result = await customerAuthServices_1.CustomerAuthService.registerCustomer(req.body);
            if (result.success) {
                res.status(201).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error during registration',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
    static async login(req, res) {
        try {
            const result = await customerAuthServices_1.CustomerAuthService.loginCustomer(req.body);
            if (result.success) {
                req.customer = result.data?.customer;
                res.status(200).json(result);
            }
            else {
                res.status(401).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error during login',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
    static async getProfile(req, res) {
        try {
            const result = await customerAuthServices_1.CustomerAuthService.getCustomerProfile(req.customer.id);
            if (result.success) {
                res.status(200).json(result);
            }
            else {
                res.status(404).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error retrieving profile',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
    static async getCompanies(req, res) {
        try {
            const result = await customerAuthServices_1.CustomerAuthService.getCompanyUsers();
            if (result.success) {
                res.status(200).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error retrieving companies',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
    // Add to CustomerAuthController
    static async getOrganizationCustomers(req, res) {
        try {
            // For organization users to see their customers
            const companyUserId = req.user?.id || req.query.companyUserId;
            if (!companyUserId) {
                const response = {
                    success: false,
                    message: 'Company user ID is required'
                };
                return res.status(400).json(response);
            }
            const result = await customerAuthServices_1.CustomerAuthService.getOrganizationCustomers(companyUserId);
            if (result.success) {
                res.status(200).json(result);
            }
            else {
                res.status(404).json(result);
            }
        }
        catch (error) {
            const response = {
                success: false,
                message: 'Internal server error retrieving organization customers',
                error: error.message
            };
            res.status(500).json(response);
        }
    }
}
exports.CustomerAuthController = CustomerAuthController;
