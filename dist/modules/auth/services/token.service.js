"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const client_1 = __importDefault(require("../../../prisma-clients/client"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const date_fns_1 = require("date-fns");
const uuid_1 = require("uuid");
const error_1 = require("../error");
class TokenService {
    jwtSecret;
    jwtExpiresIn;
    refreshTokenExpiresInDays;
    constructor(jwtSecret, jwtExpiresIn, refreshTokenExpiresInDays) {
        this.jwtSecret = jwtSecret;
        this.jwtExpiresIn = jwtExpiresIn;
        this.refreshTokenExpiresInDays = refreshTokenExpiresInDays;
    }
    async generateTokens(user, businessId) {
        const accessToken = await this.generateAccessToken(user, businessId);
        const refreshToken = await this.generateRefreshToken(user);
        return { accessToken, refreshToken };
    }
    async generateAccessToken(user, businessId) {
        const payload = {
            businessId,
            sub: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            accountType: user.accountType,
            scopes: user.scopes,
            roles: user.roles,
            iat: Math.floor(Date.now() / 1000),
            // corrected from secs to mins -> added '*60'
            exp: Math.floor(Date.now() / 1000) + parseInt(this.jwtExpiresIn) * 60,
        };
        const jwtSign = jsonwebtoken_1.default.sign(payload, this.jwtSecret);
        return jwtSign;
    }
    async generateRefreshToken(user) {
        const token = (0, uuid_1.v4)();
        const expiresAt = (0, date_fns_1.addDays)(new Date(), this.refreshTokenExpiresInDays);
        await client_1.default.refreshToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });
        return token;
    }
    async refreshTokens(refreshToken) {
        const tokenRecord = await client_1.default.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!tokenRecord ||
            tokenRecord.revokedAt ||
            tokenRecord.expiresAt < new Date()) {
            throw new error_1.UnauthorizedError("Invalid refresh token");
        }
        // Revoke the current refresh token
        await client_1.default.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() },
        });
        return this.generateTokens(tokenRecord.user);
    }
    async revokeRefreshToken(token) {
        await client_1.default.refreshToken.updateMany({
            where: { token, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async verifyAccessToken(token) {
        try {
            const verify = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            return verify;
        }
        catch (err) {
            throw new error_1.UnauthorizedError("Invalid or expired access token");
        }
    }
}
exports.TokenService = TokenService;
