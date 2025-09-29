"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIMSSetup = void 0;
const ims_service_1 = require("./ims.service");
const validateIMSSetup = (req, res, next) => {
    const validation = ims_service_1.IMSService.validateIMSSetupRequest(req.body);
    if (!validation.isValid) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.errors
        });
        return;
    }
    next();
};
exports.validateIMSSetup = validateIMSSetup;
