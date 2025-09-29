"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenStatus = exports.ResetTokenType = void 0;
// ResetToken types that match the Prisma schema
var ResetTokenType;
(function (ResetTokenType) {
    ResetTokenType["VERIFICATION_CODE"] = "VERIFICATION_CODE";
    ResetTokenType["RESET_LINK"] = "RESET_LINK";
})(ResetTokenType || (exports.ResetTokenType = ResetTokenType = {}));
// Token status for verification results
var TokenStatus;
(function (TokenStatus) {
    TokenStatus["VALID"] = "VALID";
    TokenStatus["INVALID"] = "INVALID";
    TokenStatus["EXPIRED"] = "EXPIRED";
    TokenStatus["USED"] = "USED";
})(TokenStatus || (exports.TokenStatus = TokenStatus = {}));
