"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
const client_1 = __importDefault(require("../../../../prisma-clients/client"));
const pageable_1 = require("./pageable");
/**
 * Generic paginate function for any Prisma model
 * @param modelName - Prisma model name (e.g., "user", "incident")
 * @param args - Prisma findMany arguments
 * @param page - Current page
 * @param limit - Items per page
 */
async function paginate(modelName, args, page, limit) {
    const skip = (page - 1) * limit;
    const model = client_1.default[modelName];
    const [data, total] = await Promise.all([
        model.findMany({
            ...args,
            skip,
            take: limit,
        }),
        model.count({
            where: args?.where,
        }),
    ]);
    return new pageable_1.Pageable({
        data,
        total,
        page,
        limit,
    });
}
