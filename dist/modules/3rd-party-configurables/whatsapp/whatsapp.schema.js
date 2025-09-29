"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappSchema = void 0;
const zod_1 = require("zod");
exports.whatsappSchema = zod_1.z.object({
    recipients: zod_1.z.string().array(),
    enabled: zod_1.z.boolean(),
});
