"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FingerprintController = void 0;
const fingerprint_schema_1 = require("./fingerprint.schema");
const validators_1 = require("../auth/utils/validators");
class FingerprintController {
    fingerprintService;
    constructor(fingerprintService) {
        this.fingerprintService = fingerprintService;
    }
    async fingerprintConfiguration(req, res, next) {
        try {
            const request = await (0, validators_1.validateRequest)(fingerprint_schema_1.fingerprintConfigSchema, req.body);
            const result = await this.fingerprintService.fingerprintConfiguration(request, req.user?.sub);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getUserFingerprintConfig(req, res, next) {
        try {
            const userId = req.user?.sub;
            const response = await this.fingerprintService.getUserFingerprintConfig(userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.FingerprintController = FingerprintController;
