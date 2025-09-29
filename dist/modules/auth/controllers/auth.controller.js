"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const validators_1 = require("../utils/validators");
const auth_schema_1 = require("../schemas/auth.schema");
const error_1 = require("../error");
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    registerDev = async (req, res, next) => {
        try {
            const request = await (0, validators_1.validateRequest)(auth_schema_1.registerDevSchema, req.body);
            const result = await this.authService.registerDev(request);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    registerBusiness = async (req, res, next) => {
        try {
            const request = await (0, validators_1.validateRequest)(auth_schema_1.registerBusinessSchema, req.body);
            const result = await this.authService.registerBusiness(request);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    registerDevByOauth = async (req, res, next) => {
        try {
            const request = await (0, validators_1.validateRequest)(auth_schema_1.registerDevByOauth, req.body);
            const result = await this.authService.registerDevByOauth(request);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    registerBusinessByOauth = async (req, res, next) => {
        try {
            const request = await (0, validators_1.validateRequest)(auth_schema_1.registerBusinessByOauth, req.body);
            const result = await this.authService.registerBusinessByOauth(request);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    verifyEmail = async (req, res, next) => {
        try {
            const input = await (0, validators_1.validateRequest)(auth_schema_1.verifyOTPSchema, req.body);
            const response = await this.authService.verifyEmail(input);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    resendOTP = async (req, res, next) => {
        try {
            const input = req.body;
            const response = await this.authService.resendOTP(input);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const input = await (0, validators_1.validateRequest)(auth_schema_1.loginSchema, req.body);
            const result = await this.authService.login(input);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    };
    oAuthLogin = async (req, res, next) => {
        try {
            const request = await (0, validators_1.validateRequest)(auth_schema_1.loginWithOauthSchema, req.body);
            const result = await this.authService.oAuthLogin(request);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    };
    refreshTokens = async (req, res, next) => {
        try {
            const input = await (0, validators_1.validateRequest)(auth_schema_1.refreshTokenSchema, req.body);
            const tokens = await this.authService.refreshTokens(input.refreshToken);
            res.json(tokens);
        }
        catch (error) {
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            const { refreshToken } = await (0, validators_1.validateRequest)(auth_schema_1.refreshTokenSchema, req.body);
            await this.authService.logout(refreshToken);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    };
    me = async (req, res, next) => {
        try {
            res.json(req.user);
        }
        catch (error) {
            next(error);
        }
    };
    // In AuthController class
    forgotPassword = async (req, res, next) => {
        try {
            const input = await (0, validators_1.validateRequest)(auth_schema_1.forgotPasswordSchema, req.body);
            const result = await this.authService.forgotPassword(input);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const input = await (0, validators_1.validateRequest)(auth_schema_1.resetPasswordSchema, req.body);
            const result = await this.authService.resetPassword(input);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    };
    validateResetToken = async (req, res, next) => {
        try {
            const input = await (0, validators_1.validateRequest)(auth_schema_1.validateResetTokenSchema, req.body);
            const result = await this.authService.validateResetToken(input);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    };
    // Add this method to your AuthController class
    changePassword = async (req, res, next) => {
        try {
            // Validate request body
            const input = await (0, validators_1.validateRequest)(auth_schema_1.changePasswordSchema, req.body);
            // Get user ID from authenticated request
            const userId = req.user?.sub;
            if (!userId) {
                throw new error_1.UnauthorizedError("User not authenticated");
            }
            // Call service method
            const result = await this.authService.changePassword(userId, input);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
