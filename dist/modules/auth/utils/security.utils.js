"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
class SecurityUtils {
    saltRounds;
    constructor(saltRounds = 12) {
        this.saltRounds = saltRounds;
    }
    async hashPassword(password) {
        return bcryptjs_1.default.hash(password, this.saltRounds);
    }
    async verifyPassword(password, hash) {
        return await bcryptjs_1.default.compare(password, hash);
    }
    generateRandomToken(bytes = 32) {
        return crypto_1.default.randomBytes(bytes).toString('hex');
    }
}
exports.SecurityUtils = SecurityUtils;
