"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitlabRepoSchema = void 0;
const zod_1 = require("zod");
const validation_schema_1 = require("../../../shared/validation/validation.schema");
exports.gitlabRepoSchema = zod_1.z.object({
    assignTo: validation_schema_1.emailSchema,
    repos: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().min(1),
        path_with_namespace: zod_1.z.string().min(1),
    })),
});
