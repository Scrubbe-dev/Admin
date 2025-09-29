"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserId = getUserId;
function getUserId(req) {
    return req?.user?.id;
}
