"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessMapper = void 0;
class BusinessMapper {
    constructor() { }
    static toNameAndEmail(invite) {
        return {
            firstname: invite.firstName,
            lastname: invite.lastName,
            email: invite.email,
        };
    }
}
exports.BusinessMapper = BusinessMapper;
