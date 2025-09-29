"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = __importDefault(require("@prisma/client"));
exports.prisma = new client_1.default.PrismaClient();
exports.default = exports.prisma;
