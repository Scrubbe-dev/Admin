"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const client_1 = __importDefault(require("../../../prisma-clients/client"));
const client_2 = require("@prisma/client");
class WhatsappService {
    constructor() { }
    async connectWhatsapp(businessId, userId, request) {
        try {
            await client_1.default.userThirdpartyIntegration.upsert({
                where: {
                    userId_provider: {
                        userId,
                        provider: client_2.BusinessNotificationChannels.WHATSAPP,
                    },
                },
                update: {
                    businessId,
                    metadata: {
                        recipents: request.recipients,
                    },
                },
                create: {
                    userId,
                    provider: client_2.BusinessNotificationChannels.WHATSAPP,
                    metadata: { recipents: request.recipients },
                    businessId,
                },
            });
            return { status: "success", message: "Connected to Whatsapp" };
        }
        catch (error) {
            console.error("Error connecting to Whatsapp:", error);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
}
exports.WhatsappService = WhatsappService;
