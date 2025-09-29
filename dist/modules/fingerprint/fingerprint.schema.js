"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fingerprintConfigSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.fingerprintConfigSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    environment: zod_1.z.string().min(1, "Environment is required"),
    domain: zod_1.z
        .string()
        .regex(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/, "Domain must be a valid URL or hostname")
        .optional(),
    description: zod_1.z.string().optional(),
    package: zod_1.z.nativeEnum(client_1.PackageModule, {
        required_error: "Package is required",
        invalid_type_error: "Invalid package type",
    }),
});
