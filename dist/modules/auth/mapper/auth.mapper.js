"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMapper = void 0;
class AuthMapper {
    constructor() { }
    static toUserResponse(user, businessId, token, purpose) {
        return {
            user: {
                id: user.id,
                email: user.email,
                businessId,
                firstName: user.firstName,
                lastName: user.lastName,
                accountType: user.accountType,
                purpose,
            },
            tokens: {
                refreshToken: token.refreshToken,
                accessToken: token.accessToken,
            },
        };
    }
}
exports.AuthMapper = AuthMapper;
