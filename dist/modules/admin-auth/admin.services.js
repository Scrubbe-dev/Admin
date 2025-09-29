"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdmin = exports.updateAdminPassword = exports.validateAdminCredentials = exports.createAdmin = void 0;
const client_1 = __importDefault(require("../../prisma-clients/client"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const admin_utils_1 = require("./admin.utils");
const SALT_ROUNDS = 12;
const createAdmin = async (email, password) => {
    const existingAdmin = await client_1.default.admin.findUnique({ where: { email } });
    if (existingAdmin) {
        throw new admin_utils_1.ApiError(409, 'Admin already exists');
    }
    const hashedPassword = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    return client_1.default.admin.create({
        data: {
            email,
            password: hashedPassword
        }
    });
};
exports.createAdmin = createAdmin;
const validateAdminCredentials = async (email, password) => {
    const admin = await client_1.default.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt_1.default.compare(password, admin.password))) {
        throw new admin_utils_1.ApiError(401, 'Invalid credentials');
    }
    return admin;
};
exports.validateAdminCredentials = validateAdminCredentials;
const updateAdminPassword = async (adminId, currentPassword, newPassword) => {
    const admin = await client_1.default.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
        throw new admin_utils_1.ApiError(404, 'Admin not found');
    }
    const isPasswordValid = await bcrypt_1.default.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
        throw new admin_utils_1.ApiError(401, 'Current password is incorrect');
    }
    const hashedPassword = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
    return client_1.default.admin.update({
        where: { id: adminId },
        data: { password: hashedPassword },
        select: { id: true, email: true, createdAt: true }
    });
};
exports.updateAdminPassword = updateAdminPassword;
const deleteAdmin = async (adminId) => {
    const admin = await client_1.default.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
        throw new admin_utils_1.ApiError(404, 'Admin not found');
    }
    return client_1.default.admin.delete({
        where: { id: adminId }
    });
};
exports.deleteAdmin = deleteAdmin;
