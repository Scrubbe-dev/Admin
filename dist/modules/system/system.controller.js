"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemInfoHandler = void 0;
const system_service_1 = require("./system.service");
const systemService = new system_service_1.SystemService();
const getSystemInfoHandler = async (req, res) => {
    try {
        const systemInfo = await systemService.collectSystemInfo(req);
        res.status(200).json({
            success: true,
            data: systemInfo
        });
    }
    catch (error) {
        console.error('System info error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system information'
        });
    }
};
exports.getSystemInfoHandler = getSystemInfoHandler;
