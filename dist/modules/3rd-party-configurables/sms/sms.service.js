"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSService = void 0;
const client_1 = __importDefault(require("../../../prisma-clients/client"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_2 = require("@prisma/client");
dotenv_1.default.config();
class SMSService {
    constructor() { }
    async connectSMS(request, userId) {
        try {
            await client_1.default.userThirdpartyIntegration.upsert({
                where: {
                    userId_provider: {
                        userId,
                        provider: client_2.BusinessNotificationChannels.SMS,
                    },
                },
                update: {
                    metadata: {
                        recipients: request.recipients,
                    },
                },
                create: {
                    userId,
                    provider: client_2.BusinessNotificationChannels.SMS,
                    metadata: {
                        recipients: request.recipients,
                    },
                },
            });
            return { status: "success", message: "SMS connected" };
        }
        catch (error) {
            console.error("Error occured while connecting SMS", error);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
}
exports.SMSService = SMSService;
