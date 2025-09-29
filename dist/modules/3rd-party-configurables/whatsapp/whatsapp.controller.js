"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const validators_1 = require("../../auth/utils/validators");
const whatsapp_schema_1 = require("./whatsapp.schema");
class WhatsappController {
    whatsappService;
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    async connectWhatsapp(req, res, next) {
        try {
            const userId = req.user?.sub;
            const businessId = req.user?.businessId;
            const request = await (0, validators_1.validateRequest)(whatsapp_schema_1.whatsappSchema, req.body);
            const response = await this.whatsappService.connectWhatsapp(businessId, userId, request);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WhatsappController = WhatsappController;
