"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mustBeAMember = exports.businessAccountOnly = void 0;
const client_1 = __importDefault(require("../../prisma-clients/client"));
const error_1 = require("../auth/error");
const token_service_1 = require("../auth/services/token.service");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15);
const businessAccountOnly = (req, res, next) => {
    if (req.user && req.user.accountType === "BUSINESS") {
        return next();
    }
    throw new error_1.ForbiddenError("Access restricted to business accounts only");
};
exports.businessAccountOnly = businessAccountOnly;
// business.middleware.ts
const mustBeAMember = async (req, res, next) => {
    try {
        console.log("User Info from Middleware:", req.user);
        if (!req.user?.businessId) {
            throw new error_1.ForbiddenError("You need to be associated with a business to continue");
        }
        const userId = await client_1.default.user.findFirst({
            where: { id: req.user.id }
        });
        const business = await client_1.default.business.findUnique({
            where: { id: req.user.businessId },
            include: {
                invites: {
                    where: {
                        email: req.user.email,
                        status: "ACCEPTED",
                        stillAMember: true
                    }
                }
            }
        });
        if (!business) {
            throw new error_1.ForbiddenError("You must be associated with a valid business to continue");
        }
        // Check if user is the business owner
        if (userId?.businessId === business.id) {
            return next();
        }
        // Check if user is an accepted member via invite
        const isInvitedMember = business.invites.length > 0;
        if (isInvitedMember) {
            return next();
        }
        throw new error_1.ForbiddenError("You are not a member of this business");
    }
    catch (error) {
        next(error);
    }
};
exports.mustBeAMember = mustBeAMember;
