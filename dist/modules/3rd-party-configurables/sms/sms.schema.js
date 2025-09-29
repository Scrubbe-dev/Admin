"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSMSschema = void 0;
const zod_1 = require("zod");
exports.configureSMSschema = zod_1.z.object({
    recipients: zod_1.z.string().array(),
    enabled: zod_1.z.boolean(),
});
