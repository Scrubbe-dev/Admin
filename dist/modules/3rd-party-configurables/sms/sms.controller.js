"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSController = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const validators_1 = require("../../auth/utils/validators");
const sms_schema_1 = require("./sms.schema");
dotenv_1.default.config();
class SMSController {
    smsService;
    constructor(smsService) {
        this.smsService = smsService;
    }
    async connectSMS(req, res, next) {
        try {
            const userId = req.user?.sub;
            const request = await (0, validators_1.validateRequest)(sms_schema_1.configureSMSschema, req.body);
            const response = await this.smsService.connectSMS(request, userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SMSController = SMSController;
