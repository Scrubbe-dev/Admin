"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessController = void 0;
const validators_1 = require("../auth/utils/validators");
const business_schema_1 = require("./business.schema");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("../auth/error");
const prisma_1 = __importDefault(require("../../lib/prisma"));
class BusinessController {
    businessService;
    constructor(businessService) {
        this.businessService = businessService;
    }
    async businessSetUp(req, res, next) {
        try {
            const request = await (0, validators_1.validateRequest)(business_schema_1.businessSetUpSchema, req.body);
            const result = await this.businessService.businessSetUp(request, req);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async validateInvite(req, res, next) {
        try {
            const token = req.body.token;
            if (!token) {
                return res.status(400).json({ error: "Token is required" });
            }
            const decoded = await this.businessService.validateInvite(token);
            res.json(decoded);
        }
        catch (error) {
            next(error);
        }
    }
    async fetchAllValidMembers(req, res, next) {
        try {
            const userId = req.user?.sub;
            const dataBusinessId = await prisma_1.default?.user.findUnique({
                where: { id: userId },
                select: {
                    businessId: true
                }
            });
            const businessIdFromDB = dataBusinessId?.businessId;
            const businessId = req.user?.businessId;
            console.log(userId, businessId, businessIdFromDB, " ============USERID & BUSINESSID======================");
            const response = await this.businessService.fetchAllValidMembers(userId, businessId);
            console.log(response, "===================FROM GET MEMBERS===========");
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async sendInvite(req, res, next) {
        try {
            const userdata = await this.getAuthTokenData(req, res);
            console.log(userdata, "===============USERDATA======================");
            const request = await (0, validators_1.validateRequest)(business_schema_1.inviteMembersSchema, req.body);
            console.log(request, "=========================REQUEST==============");
            const response = await this.businessService.sendInvite(userdata?.businessId, request, userdata);
            console.log(response, "=========================RESPONSE==============");
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    // controller.ts
    async decodeInvite(req, res, next) {
        try {
            const request = await (0, validators_1.validateRequest)(business_schema_1.decodeInviteSchema, req.body);
            const response = await this.businessService.decodeInvite(request.token);
            res.json({ ...response, message: "======SENT DATA FROM API========" });
        }
        catch (error) {
            next(error);
        }
    }
    // FIX: Add proper error handling
    // In your controller
    async acceptInvite(req, res, next) {
        try {
            console.log('Raw request body:', req.body);
            const request = await (0, validators_1.validateRequest)(business_schema_1.acceptInviteSchema, req.body);
            console.log('Validated request:', request);
            const response = await this.businessService.acceptInvite(request);
            res.json(response);
        }
        catch (error) {
            console.error('Controller error:', error);
            next(error);
        }
    }
    async getAuthTokenData(req, res) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new error_1.UnauthorizedError("Authentication required");
        }
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            return decoded;
        }
        catch (err) {
            console.log(err, "================  Error during authentication ======================");
        }
    }
}
exports.BusinessController = BusinessController;
;
