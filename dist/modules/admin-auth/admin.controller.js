"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdmin = exports.updatePassword = exports.loginAdmin = exports.registerAdmin = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const adminService = __importStar(require("./admin.services"));
const admin_utils_1 = require("./admin.utils");
exports.registerAdmin = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const admin = await adminService.createAdmin(email, password);
    res.status(201).json({
        success: true,
        data: {
            id: admin.id,
            email: admin.email
        }
    });
});
exports.loginAdmin = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const admin = await adminService.validateAdminCredentials(email, password);
    const token = jsonwebtoken_1.default.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({
        success: true,
        data: { token }
    });
});
exports.updatePassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user?.sub;
    if (!adminId) {
        throw new admin_utils_1.ApiError(401, 'Authentication required');
    }
    const updatedAdmin = await adminService.updateAdminPassword(adminId, currentPassword, newPassword);
    res.status(200).json({
        success: true,
        data: updatedAdmin,
        message: 'Password updated successfully'
    });
});
exports.deleteAdmin = (0, express_async_handler_1.default)(async (req, res) => {
    const { adminId } = req.params;
    const requestingAdminId = req.user?.sub;
    if (!requestingAdminId) {
        throw new admin_utils_1.ApiError(401, 'Authentication required');
    }
    // Prevent admin from deleting themselves
    if (adminId === requestingAdminId) {
        throw new admin_utils_1.ApiError(400, 'Admin cannot delete their own account');
    }
    await adminService.deleteAdmin(adminId);
    res.status(200).json({
        success: true,
        message: 'Admin deleted successfully'
    });
});
