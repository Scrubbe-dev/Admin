"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitlabUtil = void 0;
const crypto_1 = __importDefault(require("crypto"));
const gitlab_config_1 = require("../../../config/gitlab.config");
const client_1 = require("@prisma/client");
const error_1 = require("../../auth/error");
const client_2 = __importDefault(require("../../../prisma-clients/client"));
class GitlabUtil {
    constructor() { }
    key = Buffer.from(gitlab_config_1.gitlabConfig.secretEncKey, "base64");
    encryptSecret(plain) {
        console.log("========= SECRET ENC KEY =========", this.key);
        console.log("========= PLAIN =========", plain);
        const iv = crypto_1.default.randomBytes(12); // GCM recommended IV
        const cipher = crypto_1.default.createCipheriv("aes-256-gcm", this.key, iv);
        const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
        const tag = cipher.getAuthTag();
        return [
            iv.toString("base64"),
            tag.toString("base64"),
            enc.toString("base64"),
        ].join(".");
    }
    decryptSecret(blob) {
        console.log("========= BLOB =========", blob);
        const [ivB64, tagB64, dataB64] = blob.split(".");
        const iv = Buffer.from(ivB64, "base64");
        const tag = Buffer.from(tagB64, "base64");
        const data = Buffer.from(dataB64, "base64");
        const decipher = crypto_1.default.createDecipheriv("aes-256-gcm", this.key, iv);
        decipher.setAuthTag(tag);
        const dec = Buffer.concat([decipher.update(data), decipher.final()]);
        return dec.toString("utf8");
    }
    async getFreshToken(userId) {
        const integ = await client_2.default.userThirdpartyIntegration.findFirst({
            where: { userId, provider: client_1.BusinessNotificationChannels.GITLAB },
        });
        if (!integ?.accessToken)
            throw new error_1.NotFoundError("GitLab not connected");
        const token = this.decryptSecret(integ.accessToken);
        return token;
    }
}
exports.GitlabUtil = GitlabUtil;
