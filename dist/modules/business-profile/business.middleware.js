"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mustBeAMember = exports.businessAccountOnly = void 0;
const client_1 = __importDefault(require("../../prisma-clients/client"));
const error_1 = require("../auth/error");
const businessAccountOnly = (req, res, next) => {
    if (req.user && req.user.accountType === "BUSINESS") {
        return next();
    }
    throw new error_1.ForbiddenError("Access restricted to business accounts only");
};
exports.businessAccountOnly = businessAccountOnly;
const mustBeAMember = async (req, res, next) => {
    try {
        if (!req.user?.businessId) {
            throw new error_1.ForbiddenError("You need to be associated with a business to continue");
        }
        const business = await client_1.default.business.findUnique({
            where: { id: req.user.businessId },
        });
        if (!business) {
            throw new error_1.ForbiddenError("You must be associated with a valid business to continue");
        }
        // Check if user is the business owner
        if (business.userId === req.user.id) {
            return next();
        }
        // Check if user is an accepted member via invite
        const invite = await client_1.default.invites.findFirst({
            where: {
                email: req.user.email,
                sentById: req.user.businessId,
                status: "ACCEPTED",
                stillAMember: true,
            },
        });
        if (invite) {
            return next();
        }
        throw new error_1.ForbiddenError("You are not a member of this business");
    }
    catch (error) {
        next(error);
    }
};
exports.mustBeAMember = mustBeAMember;
